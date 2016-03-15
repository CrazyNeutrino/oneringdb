var ordb = ordb || {};
ordb.deck = ordb.deck || {};

(function(_deck) {

	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		options.url = ordb.static.restPath + options.url + '?language=' + ordb.static.language;
		if (options.data) {
			options.data = options.data.replace(/%5B%5D/g, '');
		}
	});

	/**
	 * @memberOf _deck
	 */
	_deck.buildErrorMessage = function(options) {
		var error = options.error || {};
		return messages = {
			kind: 'danger',
			title: 'core.error',
			message: error.message ? error.message : options.message,
			context: error.timestamp ? ('timestamp: ' + error.timestamp) : undefined
		};
	};

	_deck.buildSuccessMessage = function(options) {
		return messages = {
			kind: 'success',
			title: 'core.ok',
			message: options.message,
		};
	};

	_deck.renderMessages = function(options) {
		if (options.messages) {

			var messages = [];
			if (_.isArray(options.messages)) {
				messages = options.messages;
			} else {
				messages.push(options.messages);
			}

			var $template = $(Handlebars.templates['global-messages']({
				messages: messages
			}));

			options.$target.prepend($template);

			var hasDangerKind = _.some(messages, function(message) {
				return message.kind == 'danger';
			});

			var hideDelay = options.hideDelay || (hasDangerKind ? 5000 : 2000);
			if (hideDelay > -1) {
				setTimeout(function() {
					$template.fadeOut("slow");
				}, hideDelay);
			}
		}
	};

	_deck.showMessageModalDialog = function(options) {

		var $modal = $('#messageModal');
		if ($modal.length > 0) {
			$modal.data('bs.modal', null);
		}
		$modal = $(Handlebars.templates['deck-message-modal'](options));

		if (options.buttonYes && options.buttonYes.handler) {
			$modal.find('#messageButtonYes').click(options.buttonYes.handler);
		}
		if (options.buttonNo && options.buttonNo.handler) {
			$modal.find('#messageButtonNo').click(options.buttonNo.handler);
		}

		$modal.modal();
	};

	_deck.showDeckMemberModal = function(member, options) {

		var $modal = $('#deckMemberModal');
		if ($modal.length > 0) {
			$modal.data('bs.modal', null);
		}
		$modal = $(Handlebars.templates['deck-member-modal']({
			member: member.toJSON(),
			membersReadOnly: options.membersReadOnly
		}));

		var $buttons = $modal.find('.quantity-group .btn');
		var $active = $buttons.eq(member.get('quantity')).addClass('active');
		if (member.get('fixedQuantity') === true) {
			$active.siblings().attr('disabled', 'disabled');
		}

		if (options.membersReadOnly === false) {
			$buttons.click(function() {
				var $button = $(this);
				if (member.collection.canChangeQuantity(member, parseInt($button.text()))) {
					$button.addClass('active').siblings().removeClass('active');
					member.set({
						quantity: parseInt($button.text())
					});
				}
			});
		}

		if (options.buttonYes && options.buttonYes.handler) {
			$modal.find('#messageButtonYes').click(options.buttonYes.handler);
		}
		if (options.buttonNo && options.buttonNo.handler) {
			$modal.find('#messageButtonNo').click(options.buttonNo.handler);
		}

		$modal.modal();
	};

	_deck.prepareExportModalDialog = function(deck, options) {

		var $modal = $('#exportModal');
		if ($modal.length == 0) {
			$modal = $(Handlebars.templates['deck-export-modal']());
		}

		$modal.on('shown.bs.modal', function() {
			$modal.find('a').click(function(e) {
				e.preventDefault();
				$(this).tab('show');
			});

			var GK = 'group-key';
			var SK = 'sort-key';
			$modal.data(GK, $modal.data(GK) || 'typeDisplay');
			$modal.data(SK, $modal.data(SK) || 'name');

			var renderData = function(initial) {
				var link = {};
				if (deck.get('snapshotBaseId') && deck.get('snapshotPublic') === true) {
					link.key = 'core.checkOutDeckAt';
					link.value = /^(?:http:\/\/)?([^?]+).*/.exec(document.URL)[1];
				} else {
					link.key = 'core.createdWith';
					link.value = /^(?:http:\/\/)?([^/?]+).*/.exec(document.URL)[1];
				}
				var membersGroups = ordb.util.membersGroupBy(deck.getMembers(), $modal.data(GK), $modal.data(SK));
				var plainData = Handlebars.templates['deck-export-plain']({
					warlord: deck.get('warlord'),
					membersGroups: membersGroups,
					includeSetName: $modal.data(GK) == 'setName' ? false : true,
					link: link
				});
				$modal.find('#exportPlain textarea').val($.trim(plainData));
				var bbCodeData = Handlebars.templates['deck-export-bbcode']({
					warlord: deck.get('warlord'),
					membersGroups: membersGroups,
					includeSetName: $modal.data(GK) == 'setName' ? false : true,
					link: link
				});
				$modal.find('#exportBBCode textarea').val(bbCodeData);
				if (initial === true) {
					var backupJson = deck.getBackupJson();
					delete backupJson.links;
					delete backupJson.snapshots;
					var backupText = JSON.stringify({
						deck: backupJson
					});
					$modal.find('#exportBackup textarea').val(backupText);
				}
			};

			$modal.find('.mg-control-group label[data-group-key="' + $modal.data(GK) + '"]').addClass('active');
			$modal.find('.mg-control-group label').click(function() {
				$(this).addClass('active').siblings().removeClass('active');
				$modal.data(GK, $(this).data(GK));
				renderData(false);
			});
			$modal.find('.mg-control-sort label[data-sort-key="' + $modal.data(SK) + '"]').addClass('active');
			$modal.find('.mg-control-sort label').click(function() {
				$(this).addClass('active').siblings().removeClass('active');
				$modal.data(SK, $(this).data(SK));
				renderData(false);
			});
			$modal.on('hidden.bs.modal', function() {

			});

			var client = new ZeroClipboard($modal.find('#exportCopyAndCloseButton')[0]);
			client.on('ready', function(readyEvent) {
				client.on('copy', function(event) {
					var clipboard = event.clipboardData;
					clipboard.setData('text/plain', $('.tab-pane.active textarea').val());
				});
			});

			renderData(true);
		});

		$('.export-copy-to-clipboard').click(function() {
			$modal.modal();
		});
	};

	_deck.showDeckDescriptionModal = function(deck, options) {
		var $modal = $('#deckDescriptionModal');
		if ($modal.length > 0) {
			$modal.data('bs.modal', null);
		}
		$modal = $(Handlebars.templates['deck-description-modal']({
			deck: deck.toJSON(),
			title: options.title,
			button: options.button
		}));
		new _deck.DeckDescriptionView({
			el: $modal.find('.deck-description-view')
		}).render(deck, {
			publish: options.publish
		});

		if (options.button.clickHandler) {
			$modal.find('#' + options.button.id).click(
					function() {
						options.button.clickHandler($modal, $modal.find('#deckName').val().trim(), $modal
								.find('#deckDescription').val().trim());
					});
		}

		$modal.modal();
	};

	_deck.showDeckSaveCopyModal = function(deck, options) {

		var saveCopy = function($modal, name, description) {
			var attributes = {
				name: name,
				description: description,
				type: 'base'
			};

			var copy = deck.getBackupJson();
			delete copy.id;
			delete copy.name;
			delete copy.description;
			delete copy.snapshotBaseId;

			var copy = new ordb.model.PrivateDeck(copy, {
				parse: true
			});

			copy.listenToOnce(copy, 'invalid', function(copy) {
				ordb.deck.renderMessages({
					$target: $modal.find('.modal-body'),
					messages: buildErrorMessage({
						message: copy.validationError
					})
				});
			});

			copy.save(attributes, {
				success: function(copy, response, options) {
					// ordb.saveDeck(copy);
					ordb.deck.renderMessages({
						$target: $modal.find('.modal-body'),
						messages: _deck.buildSuccessMessage({
							message: 'ok.deck.oper.save'
						})
					});
				},
				error: function(copy, response, options) {
					ordb.deck.renderMessages({
						$target: $modal.find('.modal-body'),
						messages: _deck.buildErrorMessage({
							error: response.responseJSON,
							message: 'error.deck.oper.save'
						})
					});
				}
			});
		};

		_deck.showDeckDescriptionModal(deck, {
			title: 'core.saveDeckCopy',
			button: {
				id: 'deckSaveCopyButton',
				glyphiconClass: 'glyphicon-save',
				btnClass: 'btn-success',
				title: 'core.saveCopy',
				clickHandler: saveCopy
			}
		});
	};

	_deck.MembersFilter = Backbone.Model.extend({
		isEmpty: function() {
			return _.isEmpty(this.toJSON());
		},

		/**
		 * @memberOf MembersFilter
		 */
		filter: function(members) {
			var cardsFilterAttrs = {};
			_.each(ordb.filter.CARD_ATTRS, function(attr) {
				cardsFilterAttrs[attr] = this.get(attr);
			}, this);
			delete cardsFilterAttrs.quantity;

			var cardsFilter = new ordb.card.CardsFilter(cardsFilterAttrs);
			var cards = _.pluck(members.toJSON(), 'card');
			var ids = _.pluck(cardsFilter.filter(cards), 'id');

			var quantities = this.get('quantity');
			var filteredMembers = members.filter(function(member) {
				return (!quantities || _.contains(quantities, member.get('quantity'))) && _.contains(ids, member.get('card').id);
			});

			return filteredMembers;
		}
	});
	
	/**
	 * Base view
	 */
	_deck.ViewBase = Backbone.View.extend({
		
		events: function() {
			return {
				'click a': 'onViewLinkClick'
			};
		},
		
		/**
		 * @memberOf ViewBase
		 */
		makeCardsPopovers: function(options) {
			return this.$popovers = this.$el.find('a.toggle-popover[data-card-id]').popover({
				html: true,
				trigger: 'hover',
				placement: 'auto right',
				template: '<div class="popover popover-card" role="tooltip">' + '<div class="arrow"></div>'
						+ '<h3 class="popover-title"></h3>' + '<div class="popover-content"></div>' + '</div>',
				content: function() {
					return Handlebars.templates['card-text-content'](ordb.dict.findCard($(this).data('card-id')));
				}
			});
		},
		
		makeTooltips: function(options) {
			return this.$tooltips = this.$el.find('[data-toggle="tooltip"]').tooltip({
				container: 'body',
				trigger: 'hover',
				delay: {
					show: '1000'
				}
			});
		},
		
		destroyTooltips: function() {
			this.$el.find('[data-toggle="tooltip"]').tooltip('destroy');
		},
		
		onViewLinkClick: function(e) {
			var root = ordb.static.root;
			var href = $(e.currentTarget).attr('href');
			if (href && href.indexOf(root) == 0 && !e.ctrlKey && !e.shiftKey) {
				$(e.currentTarget).tooltip('hide');
				e.preventDefault();
				ordb.router.navigate(href.replace(ordb.static.root, ''), {
					trigger: true
				});
			}
		},

		onNonViewLinkClick: function(e) {
			var data = e.data;
			if (data && data.deck) {
				if (data.deck.history.length > 0) {
					e.preventDefault();

					var href = this.href;
					var options = {
						titleKey: 'core.deck.aboutToLeave.title',
						messageKey: 'core.deck.aboutToLeave.message',
						buttonYes: {
							labelKey: 'core.yes.long' + Math.floor(Math.random() * 2),
							class: 'btn-danger',
							handler: function() {
								window.location.href = href;

							}
						},
						buttonNo: {}
					};
					_deck.showMessageModalDialog(options);
				}
			}
		},
		
		bindMenuLinkClickHandler: function() {
			$('.navbar a').on('click', {
				deck: this.deck
			}, this.onNonViewLinkClick);
		},

		unbindMenuLinkClickHandler: function() {
			$('.navbar a').off('click');
		}
	});
	
	_deck.PageViewBase = _deck.ViewBase.extend({
		/**
		 * @memberOf PageViewBase
		 */
		renderMessages: function(options) {
			_deck.renderMessages({
				$target: this.$el.find('.content-band .container .content'),
				messages: this.messages
			});
			delete this.messages;
		}
//		viewLinkClickHandler: function(event) {
//			var root = ordb.static.root;
//			var href = $(event.currentTarget).attr('href');
//			if (href && href.indexOf(root) == 0 && !event.ctrlKey && !event.shiftKey) {
//				$(event.currentTarget).tooltip('hide');
//				event.preventDefault();
//				ordb.router.navigate(href.replace(ordb.static.root, ''), {
//					trigger: true
//				});
//			}
//		},
//		nonViewLinkClickHandler: function(event) {
//			var data = event.data;
//			if (data && data.deck) {
//				if (data.deck.history.length > 0) {
//					event.preventDefault();
//
//					var href = this.href;
//					var options = {
//						titleKey: 'core.deck.aboutToLeave.title',
//						messageKey: 'core.deck.aboutToLeave.message',
//						buttonYes: {
//							labelKey: 'core.yes.long' + Math.floor(Math.random() * 2),
//							class: 'btn-danger',
//							handler: function() {
//								window.location.href = href;
//							}
//						},
//						buttonNo: {}
//					};
//					showMessageModalDialog(options);
//				}
//			}
//		},
//		bindMenuLinkClickHandler: function() {
//			$('.navbar a').on('click', {
//				deck: this.deck
//			}, this.nonViewLinkClickHandler);
//		},
//		unbindMenuLinkClickHandler: function() {
//			$('.navbar a').off('click');
//		}
	});
	
	_deck.DeckPartialView = _deck.ViewBase.extend({
		/**
		 * @memberOf DeckPartialView
		 */
		events: function() {
			return _.extend({
				'click a.toggle-modal[data-card-id]': 'openDeckMemberModal'
			}, _deck.DeckPartialView.__super__.events.call(this));
		},
		
		initialize: function(options) {
			if (!options || !options.deck) {
				throw "Deck is undefined";
			}
			if (!options || !options.config) {
				throw "Config is undefined";
			}
			this.deck = options.deck;
			this.config = options.config;
		},
		
		onSelectOneGroupClick: function(event) {
			$(event.currentTarget).addClass('active').siblings().removeClass('active');
		},

		onSelectManyGroupClick: function(event) {
			var $target = $(event.currentTarget);
			if (event.ctrlKey) {
				$target.addClass('active').siblings().removeClass('active');
			} else {
				$target.toggleClass('active');
			}
		},
		
		openDeckMemberModal: function(e) {
			if (this.$popovers) {
				this.$popovers.popover('hide');
			}
			_deck.showDeckMemberModal(this.deck.getMembers().findWhere({
				cardId: $(e.currentTarget).data('card-id')
			}), {
				membersReadOnly: this.config.get('membersReadOnly')
			});
		}
	});

	_deck.DeckHeroesView = _deck.DeckPartialView.extend({
		className: 'deck-heroes-view',
		
		/**
		 * @memberOf DeckHeroesView
		 */
		events: function() {
			return _.extend({
				// no op at the moment
			}, _deck.DeckHeroesView.__super__.events.call(this));
		},

		initialize: function(options) {
			_deck.DeckHeroesView.__super__.initialize.call(this, options);

			this.heroes = new Backbone.Collection();
			
			// Listen to quantity change event on each member separately.
			this.deck.getMembers().each(function(member) {
				if (member.isHero()) {
					if (member.isSelected()) {
						this.heroes.add(member);
					}
					
					this.listenTo(member, 'change:quantity', function(member, quantity, options) {
						if (member.isSelected()) {
							this.heroes.add(member);
						} else {
							this.heroes.remove(member);
						}
						this.render();
					});
				}
			}, this);
		},

		render: function() {
			var template = Handlebars.templates['deck-heroes-view']({
				heroes: this.heroes.toJSON()
			});
			this.$el.html(template);
			this.makeCardsPopovers();

			return this;
		}
	});

	_deck.MembersGroupsView = _deck.DeckPartialView.extend({
		className: 'members-groups-view',
		
		/**
		 * @memberOf MembersGroupsView
		 */
		events: function() {
			return _.extend({
				'click .btn-group.select-one .btn': 'onSelectOneGroupClick',
				'click .btn-group.select-many .btn': 'onSelectManyGroupClick',
				'click .mg-control-group .btn-group .btn': 'onGroupByClick',
				'click .mg-control-sort .btn-group .btn': 'onSortByClick'
			}, _deck.MembersGroupsView.__super__.events.call(this));
		},

		initialize: function(options) {
			_deck.MembersGroupsView.__super__.initialize.call(this, options);
			
			this.keys = new Backbone.Model({
				group: 'typeDisplay',
				sort: 'name',
			});

			// Listen to group/sort key change event;
			this.listenTo(this.keys, 'change', this.render);
			// Listen to quantity change event on each member separately.
			this.deck.getMembers().each(function(member) {
				if (!member.isHero()) {
					this.listenTo(member, 'change:quantity', this.render);
				}
			}, this);
			// Listen to batch quantity change event on all members.
			this.listenTo(this.deck.getMembers(), 'batchChange:quantity', this.render);
		},

		render: function() {
			var groupKey = this.keys.get('group');
			var sortKey = this.keys.get('sort');
			var groups = ordb.util.membersGroupBy(this.deck.getMembers(), groupKey, sortKey);

			this.$el.html(Handlebars.templates['members-groups']({
				membersGroups: groups
			}));

			// Reflect group and sort keys on UI.
			this.$el.find('.mg-control-group label[data-group-key="' + groupKey + '"]').addClass('active');
			this.$el.find('.mg-control-sort label[data-sort-key="' + sortKey + '"]').addClass('active');
			this.makeCardsPopovers();

			return this;
		},
		
		onGroupByClick: function(e) {
			this.keys.set('group', $(e.currentTarget).data('group-key'));
		},

		onSortByClick: function(e) {
			this.keys.set('sort', $(e.currentTarget).data('sort-key'));
		}
	});

	_deck.MembersListView = _deck.DeckPartialView.extend({
		className: 'members-list-view',
		
		/**
		 * @memberOf MembersListView
		 */
		events: function() {
			return _.extend({
				'click .btn-group.quantity-group .btn': 'onSelectQuantityGroupClick',
			}, _deck.MembersListView.__super__.events.call(this));
		},
		
		initialize: function(options) {
			_deck.MembersListView.__super__.initialize.call(this, options);
			
			this.listenTo(this.config, 'change:membersLayout', this.render);
			this.listenTo(this.deck.getFilteredMembers(), 'reset', this.render);

			// Listen to quantity change event on each member separately.
			this.deck.getMembers().each(function(member) {
				this.listenTo(member, 'change:quantity', function(member, quantity, options) {
					var $members = this.$el.find('.members-list-item, .members-grid-item');
					var $buttons = $members.filter('[data-card-id="' + member.get('cardId') + '"]').find('.btn-group .btn');
					var quantity = '[data-quantity="' + member.get('quantity') + '"]';
					$buttons.filter(quantity).addClass('active').siblings().removeClass('active');
				});
			}, this);
			
			// Listen to batch quantity change event on all members.
			this.listenTo(this.deck.getMembers(), 'batchChange:quantity', this.render);
		},

		render: function() {
			var membersLayout = this.config.get('membersLayout') || 'list';
			var template = Handlebars.templates['deck-members-' + membersLayout]({
				members: this.deck.getFilteredMembers().toJSON(),
				membersReadOnly: this.config.get('membersReadOnly')
			});
			this.$el.html(template);
			this.applyStateToUI();
			this.makeCardsPopovers();
			this.makeTooltips();

			return this;
		},
		
		applyStateToUI: function() {
			var view = this;
			var $members = $('.members-list-item, .members-grid-item');
			$members.each(function() {
				var $member = $(this);
				var $buttons = $member.find('.quantity-group .btn');
				var member = view.deck.getFilteredMembers().at($members.index($member));
				$buttons.eq(member.getQuantity()).addClass('active');
			});
		},
		
		onSelectQuantityGroupClick: function(e) {
			var $button = $(e.currentTarget);
			var $member = $button.closest('.members-list-item, .members-grid-item');
			var member = this.deck.getFilteredMembers().findWhere({
				cardId: parseInt($member.data('card-id'))
			})
			var quantity = parseInt($button.text());
			if (this.deck.getFilteredMembers().canChangeQuantity(member, quantity)) {
				this.onSelectOneGroupClick(e);
				member.set({
					quantity: quantity
				});
			}
		}
	});

	_deck.DeckDescriptionView = Backbone.View.extend({
		className: 'deck-description-view',
		events: {
			'keyup #deckName': 'onDeckNameKeyUp',
			'keyup #deckDescription': 'onDeckDescriptionKeyUp'
		},

		/**
		 * @memberOf DeckDescriptionView
		 */
		initialize: function(options) {
			if (!options || !options.deck) {
				throw 'Deck is undefined';
			}
			this.deck = options.deck;
			this.markdown = new Markdown.getSanitizingConverter();
		},

		render: function(options) {
			var options = options || {};
			var view = this;

			var template = Handlebars.templates['deck-description-view']({
				deck: this.deck.toJSON(),
				publish: options.publish
			});
			view.$el.html(template);

			var tournamentType = this.deck.get('tournamentType');
			if (tournamentType) {
				view.$el.find('.btn[data-tournament-type="' + tournamentType + '"]').addClass('active');
			}
			var tournamentPlace = this.deck.get('tournamentPlace');
			if (tournamentPlace) {
				view.$el.find('.btn[data-tournament-place="' + tournamentPlace + '"]').addClass('active');
			}

			view.$el.find('[data-toggle="tooltip"]').tooltip({
				container: 'body',
				trigger: 'hover'
			});

			return this;
		},

		onDeckNameKeyUp: function(e) {
			this.$el.find('#deckNamePreview').empty().html(this.markdown.makeHtml($(e.currentTarget).val()));
		},

		onDeckDescriptionKeyUp: function(e) {
			this.$el.find('#deckDescriptionPreview').empty().html(this.markdown.makeHtml($(e.currentTarget).val()));
		}
	});

	_deck.DeckCommentsView = Backbone.View.extend({
		className: 'deck-comments-view',

		/**
		 * @memberOf DeckCommentsView
		 */
		render: function(deck, parentView) {
			var view = this;

			var addComment = function(comment, $ul) {
				$(Handlebars.templates['deck-comment']({
					comment: comment.toJSON()
				})).appendTo($ul).find('[data-toggle="tooltip"]').tooltip({
					container: 'body'
				});
			};

			var $template = $(Handlebars.templates['deck-comments-view']({
				deck: deck.toJSON()
			}));
			deck.get('comments').each(function(comment) {
				addComment(comment, $template.find('ul'));
			});

			view.$el.html($template);

			view.$el.find('#deckCommentPostButton').click(function() {
				var attributes = {
					value: view.$el.find('#deckCommentTextarea').val()
				};

				var deckComment = new ordb.model.DeckComment();
				deckComment.listenToOnce(deckComment, 'invalid', function(dc) {
					parentView.messages = _deck.buildErrorMessage({
						message: dc.validationError
					});
					parentView.renderMessages();
				});
				deckComment.owner = deck.get('comments').owner;
				deckComment.save(attributes, {
					success: function(deckComment, response, options) {
						parentView.messages = _deck.buildSuccessMessage({
							message: 'ok.deck.oper.saveComment'
						});
						parentView.renderMessages();
						deck.get('comments').add(deckComment);
						addComment(deckComment, $template.find('ul'));
						view.$el.find('#deckCommentTextarea').val('');
					},
					error: function(deckComment, response, options) {
						parentView.messages = _deck.buildErrorMessage({
							error: response.responseJSON,
							message: 'error.deck.oper.saveComment'
						});
						parentView.renderMessages();
					}
				});
			});
		}
	});
	
	_deck.DeckDrawView = _deck.DeckPartialView.extend({
		className: 'deck-draw-view',
		
		events: function() {
			return _.extend({
				'click .btn-group.draw-group .btn.draw-hand': 'onDrawHandClick',
				'click .btn-group.draw-group .btn.draw-deck': 'onDrawDeckClick',
				'click .btn-group.draw-group .btn.draw-some': 'onDrawSomeClick'
			}, _deck.DeckPartialView.prototype.events.call(this));
		},

		/**
		 * @memberOf DeckDrawView
		 */
		initialize: function(options) {
			_deck.DeckPartialView.prototype.initialize.call(this, options);
			this.cards = [];
			this.drawnCards = [];
		},

		render: function() {
			this.destroyTooltips();
			this.$el.html(Handlebars.templates['deck-draw-view']({
				cards: this.drawnCards
			}));

			this.makeCardsPopovers();
			this.makeTooltips();
			
			return this;
		},
		
		onDrawHandClick: function(e) {
			this.shuffle();
			this.draw(6);
		},

		onDrawDeckClick: function(e) {
			if (this.cards.length == 0 || this.cards.length == this.drawnCards.length) {
				this.shuffle();
			}
			this.draw(this.cards.length);
		},

		onDrawSomeClick: function(e) {
			if (this.cards.length == 0) {
				this.shuffle();
			}
			this.draw(parseInt($(e.currentTarget).text()));
		},

		shuffle: function() {
			this.cards = ordb.util.membersShuffle(this.deck.getMembers().filter(function(member) {
				return member.get('card').type != 'hero' && _.isNumber(member.get('quantity'))
			}));
			this.drawnCards = [];
		},

		draw: function(quantity) {
			var drawn = this.drawnCards.length;
			var remaining = this.cards.length - drawn;
			var newDrawnCards = this.cards.slice(drawn, drawn + Math.min(remaining, quantity));
			[].push.apply(this.drawnCards, newDrawnCards);
			this.render();
		}
	});

	_deck.DeckListFilterView = Backbone.View.extend({
		el: '.deck-list-filter-container',
		initialize: function(options) {
			this.config = options.config;
			this.state = new Backbone.Model({
				advanced: false
			});
		},
		buildFilterFromUI: function() {
			var filter = {};
			filter.primaryFaction = this.$el.find('.btn-group-filter.filter-faction.primary .btn.active').map(function() {
				return $(this).data('faction');
			}).get();
			filter.secondaryFaction = this.$el.find('.btn-group-filter.filter-faction.secondary .btn.active').map(function() {
				return $(this).data('faction');
			}).get();
			filter.tournamentType = this.$el.find('.btn-group-filter.filter-tournament-type .btn.active').map(function() {
				return $(this).data('tournament-type');
			}).get();
			filter.tournamentPlace = this.$el.find('.btn-group-filter.filter-tournament-place .btn.active').map(function() {
				return $(this).data('tournament-place');
			}).get();
			filter.warlordTechName = this.$el
					.find('#warlordFilter li[data-node-type="warlord"] > input[type="checkbox"]:checked').map(function() {
						return $(this).val();
					}).get();
			filter.setTechName = this.$el.find('#cardSetFilter li[data-node-type="set"] > input[type="checkbox"]:checked').map(
					function() {
						return $(this).val();
					}).get();
			filter.setMatchMode = this.$el.find('#setMatchMode input[type="radio"]:checked').val();
			if (filter.setMatchMode === 'subset') {
				filter.setSkipCoreSetOnly = this.$el.find('#setMatchMode input[type="checkbox"]:checked').length === 1;
			}
			filter.createDateMin = this.$el.find('#createDateFilter input:eq(0)').val();
			filter.createDateMax = this.$el.find('#createDateFilter input:eq(1)').val();
			filter.modifyDateMin = this.$el.find('#modifyDateFilter input:eq(0)').val();
			filter.modifyDateMax = this.$el.find('#modifyDateFilter input:eq(1)').val();

			var $publishDateFilter = this.$el.find('#publishDateFilter');
			filter.publishDateMin = $publishDateFilter.find('input:eq(0)').val();
			filter.publishDateMax = $publishDateFilter.find('input:eq(1)').val();

			filter.username = this.$el.find('#usernameFilter input').val();

			filter.order = this.$el.find('.deck-sort-container .sort-control').map(function() {
				return $(this).val();
			}).get();

			_.each(Object.keys(filter), function(key) {
				var value = filter[key];
				if (_.isString(value)) {
					value = $.trim(value);
				}
				if ((_.isObject(value) || _.isString(value)) && _.isEmpty(value)) {
					delete filter[key];
				}
			});

			return filter;
		},
		applyFilterToUI: function(filter) {
			this.$el.find('.btn-group-filter.filter-faction.primary .btn').each(function() {
				var $this = $(this);
				if (filter.primaryFaction && filter.primaryFaction.indexOf($this.data('faction')) > -1) {
					$this.addClass('active');
				}
			});
			this.$el.find('.btn-group-filter.filter-faction.secondary .btn').each(function() {
				var $this = $(this);
				if (filter.secondaryFaction && filter.secondaryFaction.indexOf($this.data('faction')) > -1) {
					$this.addClass('active');
				}
			});
			this.$el.find('.btn-group-filter.filter-tournament-type .btn').each(function() {
				var $this = $(this);
				if (filter.tournamentType && filter.tournamentType.indexOf($this.data('tournament-type')) > -1) {
					$this.addClass('active');
				}
			});
			this.$el.find('.btn-group-filter.filter-tournament-place .btn').each(function() {
				var $this = $(this);
				if (filter.tournamentPlace && filter.tournamentPlace.indexOf($this.data('tournament-place')) > -1) {
					$this.addClass('active');
				}
			});
			this.$el.find('#cardSetFilter li[data-node-type="set"] > input[type="checkbox"]').each(function() {
				var $this = $(this);
				$this.prop('checked', filter.setTechName && filter.setTechName.indexOf($this.val()) > -1);
			});
			this.$el.find('#warlordFilter li[data-node-type="warlord"] > input[type="checkbox"]').each(function() {
				var $this = $(this);
				$this.prop('checked', filter.warlordTechName && filter.warlordTechName.indexOf($this.val()) > -1);
			});
			if (filter.createDateMin) {
				this.$el.find('#createDateFilter input:eq(0)').val(filter.createDateMin);
			}
			if (filter.createDateMax) {
				this.$el.find('#createDateFilter input:eq(1)').val(filter.createDateMax);
			}
			if (filter.modifyDateMin) {
				this.$el.find('#modifyDateFilter input:eq(0)').val(filter.modifyDateMin);
			}
			if (filter.modifyDateMax) {
				this.$el.find('#modifyDateFilter input:eq(1)').val(filter.modifyDateMax);
			}
			if (filter.publishDateMin) {
				this.$el.find('#publishDateFilter input:eq(0)').val(filter.publishDateMin);
			}
			if (filter.publishDateMax) {
				this.$el.find('#publishDateFilter input:eq(1)').val(filter.publishDateMax);
			}
			if (filter.username) {
				this.$el.find('#usernameFilter input:eq(1)').val(filter.username);
			}

			if (!_.isEmpty(filter.order)) {
				this.$el.find('.deck-sort-container .sort-control').each(function(index) {
					if (filter.order[index]) {
						$(this).val(filter.order[index]);
					}
				});
			}
		},

		/**
		 * @memberOf DeckListFilterView
		 */
		render: function(options) {
			var view = this;

			options = options || {};
			options.filter = options.filter || {};

			view.state.set({
				advanced: _.isBoolean(options.advanced) ? options.advanced : view.advanced
			});

			var template = Handlebars.templates['deck-list-filter-view']({
				advanced: view.state.get('advanced'),
				config: view.config || {},
				factions: _.filter(ordb.dict.factions, function(faction) {
					return faction.techName != 'neutral';
				})
			});
			view.$el.html(template);
			view.$el.find('.input-daterange').datepicker({
				autoclose: true,
				format: 'yyyy-mm-dd',
				language: ordb.static.language,
				todayHighlight: true
			});
			view.$el.find('#moreButton').click(function() {
				var filter = view.buildFilterFromUI();
				view.render({
					advanced: true,
					searchClickHandler: options.searchClickHandler
				});
				view.applyFilterToUI(filter);
			});
			view.$el.find('#lessButton').click(function() {
				var filter = view.buildFilterFromUI();
				view.render({
					advanced: false,
					searchClickHandler: options.searchClickHandler
				});
				view.applyFilterToUI(filter);
			});
			view.$el.find('#clearButton').click(function() {
				view.$el.find('.btn-group-filter.filter-faction .btn').removeClass('active');
				view.$el.find('input[type="text"]').val('');
				view.$el.find('input[type="checkbox"]').prop('checked', '');
				view.$el.find('select').prop('selectedIndex', 0)
			});

			var cardSetFilterTemplate = Handlebars.templates['commons-ul-tree']({
				tree: ordb.dict.buildCardSetTree()
			});
			view.$el.find('#cardSetFilter').html(cardSetFilterTemplate);
			view.$el.find('#cardSetFilter li[data-node-type="cycle"] > input[type="checkbox"]').click(
					function() {
						var $this = $(this);
						$this.siblings().filter('ul').find('li[data-node-type="set"] > input[type="checkbox"]').prop('checked',
								$this.prop('checked'));
					});

			var warlordFilterTemplate = Handlebars.templates['commons-ul-tree']({
				tree: ordb.dict.buildWarlordTree()
			});
			view.$el.find('#warlordFilter').html(warlordFilterTemplate);

			var sortTemplate = Handlebars.templates['commons-sort-select']({
				sortItems: view.config.sortItems
			});
			var $container = view.$el.find('.deck-sort-container');
			$container.append(sortTemplate);
			$container.append(sortTemplate);
			$container.append(sortTemplate);

			view.applyFilterToUI(options.filter);

			//
			// click handlers
			//
			view.$el.find('.btn-group.select-many > .btn').click(function(event) {
				var $this = $(this);
				if (event.ctrlKey) {
					$this.addClass('active').siblings().removeClass('active');
				} else {
					$this.toggleClass('active');
				}
			});

			// //
			// // date range filter
			// //
			// view.$el.find('.btn-group-date-range .btn').click(function() {
			// var $this = $(this);
			// $(this).toggleClass('active').siblings().removeClass('active');
			// if ($this.hasClass('active')) {
			// var range = $this.data('date-range');
			// var filter = $this.closest('.date-range-filter');
			// }
			// });

			if (options.searchClickHandler) {
				view.$el.find('#searchButton').click(function() {
					options.searchClickHandler();
				});
			}

			//
			// tooltips
			//				
			view.$el.find('[data-toggle="tooltip"]').tooltip({
				container: 'body'
			});
		}
	});

	_deck.DeckListDataView = Backbone.View.extend({
		el: '.deck-list-data-container',

		/**
		 * @memberOf DeckListDataView
		 */
		render: function(decks, options) {
			var view = this;

			var deckWrappers = [];
			decks.each(function(deck) {
				var stats = deck.computeMembersStats();
				stats.cost.name = 'card.cost.sh';
				stats.shield.name = 'card.shieldIcons.sh';
				stats.command.name = 'card.commandIcons.sh';
				stats.attack.name = 'card.attack.sh';
				stats.hitPoints.name = 'card.hp.sh';

				deckWrappers.push({
					deck: deck.toJSON(),
					membersGroups: ordb.util.membersGroupBy(deck.getMembers(), 'typeDisplay', 'name'),
					totalQuantity: deck.computeMembersTotalQuantity.call(deck),
					totalCost: deck.computeMembersTotalCost.call(deck),
					stats: stats,
					published: deck.get('snapshotBaseId') && deck.get('snapshotPublic') === true
				});
			});

			var pagination = undefined;
			var total = decks.config.get('total');
			var pageNumber = decks.config.get('pageNumber');
			var pageSize = decks.config.get('pageSize');
			if (_.isNumber(total) && _.isNumber(pageNumber) && _.isNumber(pageSize) && total / pageSize > 1) {
				var lastPageNumber = Math.ceil(total / pageSize);
				pagination = {
					prevPage: pageNumber > 1 ? {
						number: pageNumber - 1
					} : undefined,
					nextPage: pageNumber < lastPageNumber ? {
						number: pageNumber + 1
					} : undefined,
					pages: []
				};
				_.each(_.range(1, lastPageNumber + 1), function(number) {
					pagination.pages.push({
						number: number,
						active: number == pageNumber
					});
				});
			}
			var template = Handlebars.templates['deck-list-data-view']({
				deckWrappers: deckWrappers,
				pagination: pagination,

			});
			view.$el.html(template);

			//
			// cost chart
			//
			view.$el.find('.chart-container.cost').each(function() {
				var deck = decks.findWhere({
					id: parseInt($(this).data('deck-id'))
				});
				var members = deck.getSelectedNonHeroes().toJSON();
				var membersByCost = _.groupBy(members, function(member) {
					return member.card.cost;
				});
				delete membersByCost['-1'];
				delete membersByCost['undefined'];

				var sortedKeys = _.sortBy(Object.keys(membersByCost), function(key) {
					return parseInt(key);
				});
				var dataByCost = [];
				_.each(sortedKeys, function(key) {
					dataByCost.push([ parseInt(key), _.reduce(membersByCost[key], function(count, member) {
						return count + member.quantity;
					}, 0) ]);
				});

				var colors = [];
				var base = Highcharts.getOptions().colors[0];

				for (var i = 0; i < 11; i++) {
					colors.push(Highcharts.Color(base).brighten((-i) / 20).get());
				}

				$(this).highcharts({
					chart: {
						type: 'column',
						spacingBottom: 0,
						spacingTop: 0,
						spacingLeft: 0,
						spacingRight: 0,
					},
					title: {
						text: ordb.dict.messages['core.cardsByCost'],
						style: {
							fontSize: '12px'
						}
					},
					xAxis: {
						title: {
							text: null
						},
						categories: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
						min: 0,
						max: 10
					},
					yAxis: {
						title: {
							text: null
						},
						min: 0,
						max: 26,
						tickInterval: 2
					},
					plotOptions: {
						column: {
							colorByPoint: true,
							colors: colors
						},
						series: {
							animation: false
						}
					},
					series: [ {
						name: ordb.dict.messages['core.numberOfCards'],
						data: dataByCost,
						showInLegend: false,
						pointWidth: 14
					} ],
					credits: false
				});
			});

			//
			// spheres chart
			//
			var members = ordb.util.toJSON(deck.getSelectedNonHeroes().filter(function(member) {
				return member.isSelected() && !memeber.isHero();
			}));
			var membersByFaction = _.groupBy(members, function(member) {
				return member.card.faction;
			});

			var dataByFaction = [];
			var sortedKeys = _.sortBy(Object.keys(membersByFaction), function(key) {
				if (key == deck.get('warlord').faction) {
					return 0;
				} else if (key == 'neutral') {
					return 2;
				} else {
					return 1;
				}
			});
			_.each(sortedKeys, function(key) {
				dataByFaction.push({
					name: ordb.dict.findFaction(key).name,
					y: _.reduce(membersByFaction[key], function(count, member) {
						return count + member.quantity;
					}, 0),
					color: ordb.ui.colors.factions[key].bg
				});
			});

			view.$el.find('.chart-ctr.sphere').highcharts({
				chart: {
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					type: 'pie',
					spacing: 0
				},
				title: {
					text: ordb.dict.messages['core.cardsBySphere'],
					style: {
						fontSize: '12px'
					}
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.y}</b>'
				},
				plotOptions: {
					pie: {
						size: '100%',
						allowPointSelect: false,
						cursor: 'pointer',
						dataLabels: {
							enabled: false,
							format: '{point.name}'
						},
						borderWidth: 0
					},
					series: {
						animation: false
					}
				},
				series: [ {
					name: ordb.dict.messages['core.numberOfCards'],
					colorByPoint: true,
					data: dataByFaction
				} ],
				credits: false
			});

			//
			// types chart
			//
			view.$el.find('.chart-container.type').each(function() {
				var deck = decks.findWhere({
					id: parseInt($(this).data('deck-id'))
				});
				var members = ordb.util.toJSON(deck.getSelectedNonHeroes().filter(function(member) {
					return member.get('quantity') > 0;
				}));
				var membersByType = _.groupBy(members, function(member) {
					return member.card.type;
				});

				var dataByType = [];
				var order = [ 'army', 'attachment', 'support', 'event', 'synapse' ];
				var sortedKeys = _.sortBy(Object.keys(membersByType), function(key) {
					return order.indexOf(key);
				});
				_.each(sortedKeys, function(key) {
					dataByType.push({
						name: ordb.dict.findCardType(key).name,
						y: _.reduce(membersByType[key], function(count, member) {
							return count + member.quantity;
						}, 0),
						color: ordb.ui.colors.types[key].bg
					});
				});

				$(this).highcharts({
					chart: {
						plotBackgroundColor: null,
						plotBorderWidth: null,
						plotShadow: false,
						type: 'pie',
						spacing: 0
					},
					title: {
						text: ordb.dict.messages['core.cardsByType'],
						style: {
							fontSize: '12px'
						}
					},
					tooltip: {
						pointFormat: '{series.name}: <b>{point.y}</b>'
					},
					plotOptions: {
						pie: {
							size: '100%',
							allowPointSelect: false,
							cursor: 'pointer',
							dataLabels: {
								enabled: false,
								format: '{point.name}'/*
														 * , style: { color: (Highcharts.theme &&
														 * Highcharts.theme.contrastTextColor) ||
														 * 'black' }
														 */
							},
							borderWidth: 0
						},
						series: {
							animation: false
						}
					},
					series: [ {
						name: ordb.dict.messages['core.numberOfCards'],
						colorByPoint: true,
						data: dataByType
					} ],
					credits: false
				});
			});

			//
			// click handlers
			//
			view.$el.find('.expand-toggle').click(function() {
				$(this).toggleClass('active').parents('.deck-container').find('.members').toggleClass('hidden');
			});
			view.$el.find('.pagination-container a[data-page-number]').click(function(event) {
				if (options.pageClickHandler) {
					options.pageClickHandler(parseInt($(this).data("page-number")));
				}
				event.preventDefault();
			});

			//
			// tooltips
			//				
			view.$el.find('[data-toggle="tooltip"]').tooltip({
				container: 'body'
			});
		}
	});
	
	_deck.MembersChartsView = _deck.DeckPartialView.extend({
		className: 'members-charts-view',
		
		/**
		 * @memberOf MembersChartsView
		 */
		events: function() {
			return _.extend({
				// no op at the moment
			}, _deck.MembersChartsView.__super__.events.call(this));
		},

		initialize: function(options) {
			_deck.MembersChartsView.__super__.initialize.call(this, options);
			
			_.bindAll(this, 'render');

			// Listen to quantity change event on each member separately.
			this.deck.getMembers().each(function(member) {
				this.listenTo(member, 'change:quantity', this.render);				
			}, this);
			// Listen to batch quantity change event on all members.
			this.listenTo(this.deck.getMembers(), 'batchChange:quantity', this.render);
		},

		render: function() {
			var template = Handlebars.templates['members-charts-view']();
			this.$el.html(template);
			
//			this.prepareCostCharts();
			this.prepareSpheresChart();
			this.prepareTypesChart();

			return this;
		},
		
		prepareCostChart: function() {
			//
			// cost chart
			//
			view.$el.find('.chart-ctr.cost').each(function() {
				var members = deck.getMembers().toJSON();
				var membersByCost = _.groupBy(members, function(member) {
					return member.card.cost;
				});
				delete membersByCost['-1'];
				delete membersByCost['undefined'];
	
				var sortedKeys = _.sortBy(Object.keys(membersByCost), function(key) {
					return parseInt(key);
				});
				var dataByCost = [];
				_.each(sortedKeys, function(key) {
					dataByCost.push([ parseInt(key), _.reduce(membersByCost[key], function(count, member) {
						return count + member.quantity;
					}, 0) ]);
				});
	
				var colors = [];
				var base = Highcharts.getOptions().colors[0];
	
				for (var i = 0; i < 11; i++) {
					colors.push(Highcharts.Color(base).brighten((-i) / 20).get());
				}
	
				$(this).highcharts({
					chart: {
						type: 'column',
						spacingBottom: 0,
						spacingTop: 0,
						spacingLeft: 0,
						spacingRight: 0,
					},
					title: {
						text: ordb.dict.messages['core.cardsByCost'],
						style: {
							fontSize: '12px'
						}
					},
					xAxis: {
						title: {
							text: null
						},
						categories: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
						min: 0,
						max: 10
					},
					yAxis: {
						title: {
							text: null
						},
						min: 0,
						max: 26,
						tickInterval: 2
					},
					plotOptions: {
						column: {
							colorByPoint: true,
							colors: colors
						},
						series: {
							animation: false
						}
					},
					series: [ {
						name: ordb.dict.messages['core.numberOfCards'],
						data: dataByCost,
						showInLegend: false,
						pointWidth: 14
					} ],
					credits: false
				});
			});
		},

		prepareSpheresChart: function() {
			var membersBySphere = _.groupBy(this.deck.getSelectedNonHeroes().toJSON(), function(member) {
				return member.card.sphere;
			});
			
			var order = [ 'leadership', 'tactics', 'spirit', 'lore', 'baggins', 'fellowship', 'neutral' ];
			var sortedKeys = _.sortBy(Object.keys(membersBySphere), function(key) {
				return order.indexOf(key);
			});
			var dataBySphere = [];
			_.each(sortedKeys, function(key) {
				dataBySphere.push({
					name: ordb.dict.findSphere(key).name,
					y: _.reduce(membersBySphere[key], function(count, member) {
						return count + member.quantity;
					}, 0),
					color: ordb.ui.colors.spheres[key].bg
				});
			});

			this.$el.find('.chart-ctr.sphere').highcharts({
				chart: {
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					type: 'pie',
					spacing: 0
				},
				title: {
					text: ordb.dict.messages['core.cardsBySphere'],
					style: {
						fontSize: '12px'
					}
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.y}</b>'
				},
				plotOptions: {
					pie: {
						size: '100%',
						allowPointSelect: false,
						cursor: 'pointer',
						dataLabels: {
							enabled: false,
							format: '{point.name}'
						},
						borderWidth: 0
					},
					series: {
						animation: false
					}
				},
				series: [ {
					name: ordb.dict.messages['core.numberOfCards'],
					colorByPoint: true,
					data: dataBySphere
				} ],
				credits: false
			});
		},

		prepareTypesChart: function() {
			var membersByType = _.groupBy(this.deck.getSelectedNonHeroes().toJSON(), function(member) {
				return member.card.type;
			});

			var order = [ 'ally', 'attachment', 'event', 'treasure' ];
			var sortedKeys = _.sortBy(Object.keys(membersByType), function(key) {
				return order.indexOf(key);
			});
			var dataByType = [];
			_.each(sortedKeys, function(key) {
				dataByType.push({
					name: ordb.dict.findCardType(key).name,
					y: _.reduce(membersByType[key], function(count, member) {
						return count + member.quantity;
					}, 0),
					color: ordb.ui.colors.types[key].bg
				});
			});
	
			this.$el.find('.chart-ctr.type').highcharts({
				chart: {
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					type: 'pie',
					spacing: 0
				},
				title: {
					text: ordb.dict.messages['core.cardsByType'],
					style: {
						fontSize: '12px'
					}
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.y}</b>'
				},
				plotOptions: {
					pie: {
						size: '100%',
						allowPointSelect: false,
						cursor: 'pointer',
						dataLabels: {
							enabled: false,
							format: '{point.name}'
						},
						borderWidth: 0
					},
					series: {
						animation: false
					}
				},
				series: [ {
					name: ordb.dict.messages['core.numberOfCards'],
					colorByPoint: true,
					data: dataByType
				} ],
				credits: false
			});
		}
	});

})(ordb.deck);