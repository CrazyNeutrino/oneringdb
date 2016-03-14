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
		isNotHero: function() {
			return this.getCard().type != 'hero';
		},
		isSelected: function() {
			return this.getQuantity() > 0;
		},
		isNotSelected: function() {
			return this.getQuantity() == 0;
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
		
		computeTotalCost: function() {
			return this.reduce(function(total, member) {
				return total += member.isHero() ? 0 : member.getQuantity() * member.getCard().resourceCost; 
			}, 0);
		},
		
		computeStatistics: function() {
			var stats = {};
			var keys = [ 'resourceCost', 'willpower', 'attack', 'defense', 'hitPoints' ];

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
				if (quantity > 0 && card.type != 'hero') {
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
		},
		
		canChangeQuantity: function(member, quantity) {
			if (quantity == 0 || member.isNotHero()) {
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
//		members: new _model.DeckMembers(),
//		filteredMembers: new _model.DeckMembers(),
//		selectedMembers: new _model.DeckMembers(),
//		selectedHeroes: new _model.DeckMembers(),
//		history: new _model.DeckHistory(),
		
		/**
		 * @memberOf Deck
		 */
		initialize: function(attributes) {
			attributes.type = attributes.type || 'base';
			
			this.members = new _model.DeckMembers();
			this.filteredMembers = new _model.DeckMembers();
			this.selectedMembers = new _model.DeckMembers();
			this.selectedHeroes = new _model.DeckMembers();
			this.history = new _model.DeckHistory();
		},
		
		parse: function(response) {
//			response.filteredMembers = new _model.DeckMembers();
//			response.selectedMembers = new _model.DeckMembers();
//			response.selectedHeroes = new _model.DeckMembers();
			
			var processMember = _.bind(function(member, quantity) {
				if (member.isHero()) {
					if (quantity == 0) {
						this.getSelectedHeroes().remove(member);
					} else {
						this.getSelectedHeroes().add(member);
					}
				} else {
					if (quantity == 0) {
						this.getSelectedMembers().remove(member);
					} else {
						this.getSelectedMembers().add(member);
					}
				}
			}, this);
			
			response.createDateMillis = moment.tz(response.createDate, ordb.static.timezone).valueOf();
			response.modifyDateMillis = moment.tz(response.modifyDate, ordb.static.timezone).valueOf();
			this.members = new _model.DeckMembers(response.members, {
				parse: true,
				comparator: ordb.util.buildMembersDefaultComparator()
			});
			this.members.fillMissing();
			this.members.adjustQuantities(response.coreSetQuantity);
			this.members.each(function(member) {
				processMember.call(response, member, member.getQuantity());
				this.listenTo(member, 'change:quantity', processMember);
			}, this);
			
			delete response.members;
			
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
			
			return response;
		},
		
		toJSON: function() {
			var json = _model.Deck.__super__.toJSON.apply(this, arguments);
			if (json.members instanceof Backbone.Collection) {
				json.members = json.members.toJSON();
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
//			return this.get('members');
			return this.members;
		},
		
		getFilteredMembers: function() {
//			return this.get('filteredMembers');
			return this.filteredMembers;
		},
		
		getSelectedMembers: function() {
//			return this.get('selectedMembers');
			return this.selectedMembers;
		},
		
		getSelectedHeroes: function() {
//			return this.get('selectedHeroes');
			return this.selectedHeroes;
		},
		
		validate: function(attributes, options) {
			var name = $.trim(attributes.name);
			if (name.length == 0) {
				return 'error.deck.name.empty';
			}
		},
		
		computeMembersTotalQuantity: function() {
			return this.members.computeTotalQuantity();
		},
		
		computeMembersTotalCost: function() {
			return this.members.computeTotalCost();
		},
		
		computeMembersStatistics: function() {
			return this.members.computeStatistics();
		},
		
		adjustMembersQuantities: function() {
			this.members.adjustQuantities(this.get('coreSetQuantity'));
		},
		
		fillMissingMembers: function() {
			this.members.fillMissing();
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
				var sourceJson = source.toJSON();

				delete sourceJson.createDate;
				delete sourceJson.modifyDate;
				delete sourceJson.createDateMillis;
				delete sourceJson.modifyDateMillis;
				delete sourceJson.snapshots;
				delete sourceJson.relatedSnapshots;
				delete sourceJson.links;
				delete sourceJson.comments;
				
				sourceJson.members = this.selectedMembers.toJSON();
				this.selectedHeroes.each(function(hero, index) {
//					var hero = hero.toJSON();
//					delete hero.card;
//					delete hero.fixedQuantity;
//					delete hero.maxQuantityFixed;
//					delete hero.maxQuantity;
					sourceJson['heroId' + index] = hero.get('cardId');
				});
				if (_.isArray(sourceJson.members)) {
					_.each(sourceJson.members, function(member) {
						delete member.card;
						delete member.fixedQuantity;
						delete member.maxQuantityFixed;
						delete member.maxQuantity;
					});
				}
				target = new _model.PrivateDeck(sourceJson);
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