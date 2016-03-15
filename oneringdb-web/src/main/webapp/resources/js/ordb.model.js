var ordb = ordb || {};

//
// model
//
ordb.model = ordb.model || {};
(function(_model) {

	/**
	 * @memberOf _model
	 */
	_model.dummy = function() {
	};

	_model.Card = Backbone.Model.extend({
		urlRoot: '/card',
	});

	_model.Cards = Backbone.Collection.extend({
		url: '/card',
		model: _model.Card
	});

	_model.DeckMember = Backbone.Model.extend({
		/**
		 * @memberOf DeckMember
		 */
		parse: function(response) {
			response.card = _.clone(ordb.dict.findCard(response.cardId));
			response.maxQuantityFixed = response.card.type == 'hero';
			return response;
		},
		getCard: function() {
			return this.get('card');
		},
		getQuantity: function() {
			return this.get('quantity');
		},
		isHero: function() {
			return this.getCard().type == 'hero';
		},
		isSelected: function() {
			return this.getQuantity() > 0;
		}
	});

	_model.DeckMembers = Backbone.Collection.extend({
		model: _model.DeckMember,
		
		/**
		 * @memberOf DeckMembers
		 */
		initialize: function(options) {
		},
		
		computeTotalQuantity: function() {
			return this.reduce(function(total, member) {
				return total += member.isHero() ? 0 : member.getQuantity(); 
			}, 0);
		},
		
		computeTotalThreatCost: function() {
			return this.reduce(function(total, member) {
				return total += member.isHero() ? member.getQuantity() * member.getCard().threatCost : 0; 
			}, 0);
		},
		
		computeTotalResourceCost: function() {
			return this.reduce(function(total, member) {
				return total += member.isHero() ? 0 : member.getQuantity() * member.getCard().resourceCost; 
			}, 0);
		},
		
		computeStatistics: function() {
			var stats = {};
			var keys = [ 'threatCost', 'resourceCost', 'willpower', 'attack', 'defense', 'hitPoints' ];

			_.each(keys, function(key) {
				stats[key] = {
					sum: 0,
					quantity: 0,
					quantityX: 0
				};
			});

			this.each(function(member) {
				var quantity = member.getQuantity();
				var card = member.getCard();
				if (quantity > 0) {
					_.each(keys, function(key) {
						if (!_.isUndefined(card[key])) {
							if (card[key] === -1) {
								stats[key].quantityX += quantity;
							} else {
								stats[key].sum += card[key] * quantity;
								stats[key].quantity += quantity;
							}
						}
					});
				}
			});

			_.each(keys, function(key) {
				if (stats[key].quantity > 0) {
					stats[key].average = Math.round(stats[key].sum / stats[key].quantity
							* 100) / 100;
				} else {
					stats[key].average = 0;
				}
			});

			return stats;
		},
		
		adjustQuantities: function(coreSetQuantity) {
			this.each(function(member) {
				var quantities;
				if (member.get('maxQuantityFixed') === true) {
					quantities = {
						maxQuantity: member.getCard().quantity
					};
				} else {
					var maxQuantity = Math.min(3, member.getCard().quantity * coreSetQuantity);
					quantities = {
						maxQuantity: maxQuantity,
						quantity: Math.min(member.getQuantity(), maxQuantity)
					};
				}
				member.set(quantities, {
					silent: true
				});
			});
			this.trigger('batchChange:quantity', this);
			
			return this;
		},
		
		canChangeQuantity: function(member, quantity) {
			if (quantity == 0 || !member.isHero()) {
				return true;
			}

			var selected = 0;
			return this.every(function(m) {
				if (m.isHero() && m.isSelected()) {
					return ++selected < 3 && m.getCard().techName != member.getCard().techName;
				} else {
					return true;
				}
			});
		},
		
		fillMissing: function() {
			var index = this.indexByCardId();
			var members = [];
			_.each(ordb.dict.getPlayerDeckCards(), function(card) {
				if (!index[card.id]) {
					members.push(new _model.DeckMember({
						cardId: card.id,
						quantity: 0,
						maxQuantity: card.quantity
					}, {
						parse: true
					}));
				}
			});
			this.add(members);
			
			return this;
		},
		
		indexByCardId: function() {
			return this.indexBy(function(member) {
				return member.getCard().id;
			})
		},
		
		indexByCardType: function() {
			return this.indexBy(function(member) {
				return member.getCard().type;
			})
		}
	});

	_model.DeckHistoryItem = Backbone.Model;

	_model.DeckHistory = Backbone.Collection.extend({
		model: _model.DeckHistoryItem
	});

	_model.DeckLink = Backbone.Model.extend({
		/**
		 * @memberOf DeckLink
		 */
		initialize: function(attributes, options) {
			if (options) {
				this.owner = options.owner;
			}
		},
		urlRoot: function() {
			return _.result(this.owner, 'url', '') + '/link';
		},
	});

	_model.DeckLinks = Backbone.Collection.extend({
		/**
		 * @memberOf DeckLinks
		 */
		initialize: function(models, options) {
			this.owner = options.owner;
		},
		url: function() {
			return _.result(this.owner, 'url', '') + '/link';
		},
		model: function(attributes, options) {
			return new _model.DeckLink(attributes, options);
		}
	});

	_model.DeckComment = Backbone.Model.extend({
		/**
		 * @memberOf DeckComment
		 */
		initialize: function(attributes, options) {
			if (options) {
				this.owner = options.owner;
			}
		},
		urlRoot: function() {
			return _.result(this.owner, 'url', '') + '/comment';
		},
		validate: function(attributes, options) {
			var value = $.trim(attributes.value);
			if (value.length == 0) {
				return 'error.deck.comment.empty';
			}
		}
	});

	_model.DeckComments = Backbone.Collection.extend({
		/**
		 * @memberOf DeckComments
		 */
		initialize: function(models, options) {
			this.owner = options.owner;
		},
		url: function() {
			return _.result(this.owner, 'url', '') + '/comment';
		},
		model: function(attributes, options) {
			return new _model.DeckComment(attributes, options);
		}
	});

	_model.Deck = Backbone.Model.extend({
		/**
		 * @memberOf Deck
		 */
		initialize: function(attributes) {
			attributes.type = attributes.type || 'base';
			this.history = new _model.DeckHistory();
		},
		
		parse: function(response) {
			var processQuantityChange = _.bind(function(member, quantity) {
				if (member.isHero()) {
					if (quantity == 0) {
						this.getSelectedHeroes().remove(member);
					} else {
						this.getSelectedHeroes().add(member);
					}
				} else {
					if (quantity == 0) {
						this.getSelectedNonHeroes().remove(member);
					} else {
						this.getSelectedNonHeroes().add(member);
					}
				}
			}, this);
			
			response.createDateMillis = moment.tz(response.createDate, ordb.static.timezone).valueOf();
			response.modifyDateMillis = moment.tz(response.modifyDate, ordb.static.timezone).valueOf();
			
			response.members = new _model.DeckMembers(response.members, {
				parse: true,
				comparator: ordb.util.buildMembersDefaultComparator()
			});
			var grouppedMembers = response.members.groupBy(function(member) {
				return member.isSelected() ? (member.isHero() ? 'selectedHero' : 'selectedNonHero') : 'rest';
			});
			response.selectedHeroes = new _model.DeckMembers(grouppedMembers['selectedHero'], {
				comparator: 'sequence'
			});
			response.selectedNonHeroes = new _model.DeckMembers(grouppedMembers['selectedNonHero']);
			response.filteredMembers = new _model.DeckMembers();
			
			response.members.fillMissing().adjustQuantities(response.coreSetQuantity);
			response.members.each(function(member) {
				this.listenTo(member, 'change:quantity', processQuantityChange);
			}, this);
			
			response.links = new _model.DeckLinks(response.links, {
				parse: true,
				owner: this
			});
			response.links.on('add', function(link) {
				link.owner = this.owner;
			}).on('remove', function(link) {
				link.owner = undefined;
			});
			
			response.comments = new _model.DeckComments(response.comments, {
				parse: true,
				owner: this
			});
			response.comments.on('add', function(comment) {
				comment.owner = this.owner;
			}).on('remove', function(comment) {
				comment.owner = undefined;
			});
			
//			var tmp = _.chain(response.selectedHeroes.countBy(function(hero) {
//				return hero.getCard().sphere; 
//			})).pairs().max(function(pair) {
//				return pair[1]
//			}).value();
//			if (tmp[1] == 1) {
//				response.primarySphere = response.selectedHeroes.at(0).getCard().sphere;
//			} else {
//				response.primarySphere = tmp[0];
//			}
			response.primarySphere = 'dummy';
			
			return response;
		},
		
		toJSON: function() {
			var json = _model.Deck.__super__.toJSON.apply(this, arguments);
			if (json.members instanceof Backbone.Collection) {
				json.members = json.members.toJSON();
			}
			if (json.selectedHeroes instanceof Backbone.Collection) {
				json.selectedHeroes = json.selectedHeroes.toJSON();
			}
			if (json.selectedNonHeroes instanceof Backbone.Collection) {
				json.selectedNonHeroes = json.selectedNonHeroes.toJSON();
			}
			if (json.filteredMembers instanceof Backbone.Collection) {
				json.filteredMembers = json.filteredMembers.toJSON();
			}
			if (json.links instanceof Backbone.Collection) {
				json.links = json.links.toJSON();
			}
			if (json.snapshots instanceof Backbone.Collection) {
				json.snapshots = json.snapshots.toJSON();
			}
			if (json.comments instanceof Backbone.Collection) {
				json.comments = json.comments.toJSON();
			}
			return json;
		},
		
		getMembers: function() {
			return this.get('members');
		},
		
		getFilteredMembers: function() {
			return this.get('filteredMembers');
		},
		
		getSelectedHeroes: function() {
			return this.get('selectedHeroes');
		},
		
		getSelectedNonHeroes: function() {
			return this.get('selectedNonHeroes');
		},
		
		validate: function(attributes, options) {
			var name = $.trim(attributes.name);
			if (name.length == 0) {
				return 'error.deck.name.empty';
			}
		},
		
		computeMembersTotalQuantity: function() {
			return this.getMembers().computeTotalQuantity();
		},
		
		computeMembersTotalCost: function() {
			return this.getMembers().computeTotalCost();
		},
		
		computeMembersStatistics: function() {
			return this.getMembers().computeStatistics();
		},
		
		adjustMembersQuantities: function() {
			this.getMembers().adjustQuantities(this.get('coreSetQuantity'));
		},
		
		fillMissingMembers: function() {
			this.getMembers().fillMissing();
		},
		
		getBackupJson: function() {
			var json = this.toJSON();
			delete json.techName;
			delete json.filteredMembers;
			delete json.createDate;
			delete json.modifyDate;
			delete json.snapshots;
			// delete json.relatedSnapshots;
			delete json.links;
			delete json.comments;
			var members = json.members;
			json.members = [];
			_.each(members, function(member) {
				if (member.quantity && member.quantity > 0) {
					delete member.maxQuantity;
					delete member.fixedQuantity;
					delete member.maxQuantityFixed;
					delete member.card;
					json.members.push(member);
				}
			});
			return json;
		}
	});

	_model.Decks = Backbone.Collection.extend({
		/**
		 * @memberOf Decks
		 */
		initialize: function() {
			this.config = new Backbone.Model();
		},
		parse: function(response) {
			var decks;
			if (_.isArray(response)) {
				decks = response;
			} else {
				this.config.set({
					total: response.total,
					pageNumber: response.pageNumber,
					pageSize: response.pageSize
				});
				decks = response.decks;
			}
			return decks;
		}
	});

	_model.PublicDeck = _model.Deck.extend({
		urlRoot: '/deck/public',
		/**
		 * @memberOf PublicDeck
		 */
		parse: function(response) {
			var r = _model.PrivateDeck.__super__.parse.apply(this, [ response ]);
			if (_.isEmpty(r.snapshots)) {
				r.snapshots = new _model.PublicDecks();
			} else {
				r.snapshots = new _model.PublicDecks(r.snapshots, {
					parse: true,
					comparator: function(model) {
						return model.get('createDateMillis') * -1;
					}
				});
			}
			return r;
		}
	});

	_model.PublicDecks = _model.Decks.extend({
		url: '/deck/public',
		model: _model.PublicDeck
	});

	_model.PrivateDeck = _model.Deck.extend({
		urlRoot: '/deck',
		/**
		 * @memberOf PrivateDeck
		 */
		sync: function(method, source, options) {
			console.info('sync: ' + method);
			var target = source;
			if (method === 'create' || method === 'update') {
				var json = source.toJSON();

				json.members = [];
				_.each(json.selectedHeroes, function(hero, index) {
					json.members.push({
						cardId: hero.cardId,
						quantity: hero.quantity,
						sequence: json.members.length
						
					})
				});

				_.each(json.selectedNonHeroes, function(nonHero) {
					json.members.push({
						cardId: nonHero.cardId,
						quantity: nonHero.quantity,
						sequence: json.members.length
					})
				});
				
				delete json.selectedHeroes;
				delete json.selectedNonHeroes;
				delete json.filteredMembers;
				delete json.createDate;
				delete json.modifyDate;
				delete json.createDateMillis;
				delete json.modifyDateMillis;
				delete json.snapshots;
				delete json.relatedSnapshots;
				delete json.links;
				delete json.comments;
				
				target = new _model.PrivateDeck(json);
			}

			_model.PrivateDeck.__super__.sync.apply(this, [ method, target, options ]);
		},
		parse: function(response) {
			var r = _model.PrivateDeck.__super__.parse.apply(this, [ response ]);
			if (_.isEmpty(r.snapshots)) {
				r.snapshots = new _model.PrivateDecks();
			} else {
				r.snapshots = new _model.PrivateDecks(r.snapshots, {
					parse: true,
					comparator: function(model) {
						return model.get('createDateMillis') * -1;
					}
				});
			}
			return r;
		}
	});

	_model.PrivateDecks = _model.Decks.extend({
		url: '/deck',
		model: _model.PrivateDeck
	});

})(ordb.model);