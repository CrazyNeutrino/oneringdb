var ordb = ordb || {};
ordb.deck = ordb.deck || {};

(function(_deck) {

	/**
	 * @memberOf _deck
	 */
	_deck.showDeckPublishModal = function(deck, options) {

		var publish = function($modal, name, description) {
			var attributes = {
				name: name,
				description: description,
				type: 'snapshot',
				snapshotBaseId: deck.get('id'),
				snapshotPublic: true,
				tournamentType: $modal.find('.btn-group.tournament-type > .btn.active').data('tournament-type'),
				tournamentPlace: $modal.find('.btn-group.tournament-place > .btn.active').data('tournament-place'),
			};

			var json = deck.getBackupJson();
			delete json.id;
			delete json.name;
			delete json.description;

			var snapshot = new ordb.model.PrivateDeck(json, {
				parse: true
			});

			snapshot.listenToOnce(snapshot, 'invalid', function(snapshot) {
				_deck.renderMessages({
					$target: $modal.find('.modal-body'),
					messages: _deck.buildErrorMessage({
						message: snapshot.validationError
					})
				});
			});

			snapshot.save(attributes, {
				success: function(snapshot, response, options) {
					_deck.renderMessages({
						$target: $modal.find('.modal-body'),
						messages: _deck.buildSuccessMessage({
							message: 'ok.deck.oper.publish'
						})
					});
					deck.get('snapshots').unshift(snapshot);
				},
				error: function(snapshot, response, options) {
					_deck.renderMessages({
						$target: $modal.find('.modal-body'),
						messages: _deck.buildErrorMessage({
							error: response.responseJSON,
							message: 'error.deck.oper.publish'
						})
					});
				}
			});
		};

		_deck.showDeckDescriptionModal(deck, {
			title: 'core.publishDeck',
			button: {
				id: 'deckPublishButton',
				glyphiconClass: 'glyphicon-share',
				btnClass: 'btn-success',
				title: 'core.publish',
				clickHandler: publish
			},
			publish: {}
		});
	};

	_deck.showDeckEditSnapshotModal = function(snapshot, modalOptions) {

		var editSnapshot = function($modal, name, description) {
			var attributes = {
				name: name,
				description: description,
				tournamentType: $modal.find('.btn-group.tournament-type > .btn.active').data('tournament-type'),
				tournamentPlace: $modal.find('.btn-group.tournament-place > .btn.active').data('tournament-place')
			};

			snapshot.listenToOnce(snapshot, 'invalid', function(snapshot) {
				_deck.renderMessages({
					$target: $modal.find('.modal-body'),
					messages: _deck.buildErrorMessage({
						message: snapshot.validationError
					})
				});
			});

			snapshot.save(attributes, {
				success: function(snapshot, response, options) {
					_deck.renderMessages({
						$target: $modal.find('.modal-body'),
						messages: _deck.buildSuccessMessage({
							message: 'ok.deck.oper.modify'
						})
					});
					if (modalOptions.success) {
						modalOptions.success();
					}
				},
				error: function(snapshot, response, options) {
					_deck.renderMessages({
						$target: $modal.find('.modal-body'),
						messages: _deck.buildErrorMessage({
							error: response.responseJSON,
							message: 'error.deck.oper.modify'
						})
					});
				}
			});
		};

		_deck.showDeckDescriptionModal(snapshot, {
			title: 'core.editPublishedVersion',
			button: {
				id: 'deckEditSnapshotButton',
				glyphiconClass: 'glyphicon-pencil',
				btnClass: 'btn-success',
				title: 'core.edit',
				clickHandler: editSnapshot
			},
			publish: {}
		});
	};

	/**
	 * Deck list view
	 */
	_deck.UserDeckListView = _deck.PageViewBase.extend({
		events: {
			'click .user-deck-list-view a': 'onViewLinkClickHandler'
		},
		decks: new ordb.model.PrivateDecks(),
		filter: {},
		filterAdvanced: false,

		/**
		 * @memberOf UserDeckListView
		 */
		render: function() {
			var view = this;

			var queryDeckList = function(pageNumber) {
				view.filter = view.deckListFilterView.buildFilterFromUI();

				var data = _.clone(view.filter);
				data.pageNumber = _.isNumber(pageNumber) ? pageNumber : 1;
				data.pageSize = 20;
				view.decks.fetch({
					data: data,
					success: function() {
						view.deckListDataView.render(view.decks, {
							pageClickHandler: queryDeckList
						});
					}
				});
			};

			view.unbindMenuLinkClickHandler();
			ordb.ui.adjustWrapperStyle({
				backgroundColor: '#f2f2f2'
			});

			var template = Handlebars.templates['user-deck-list-view']();
			view.$el.html(template);
			view.renderMessages();
			var actionsTemplate = Handlebars.templates['deck-actions']({
				actions: {
					decknew: {
						showText: true
					},
					deckimport: {
						showText: true
					},
					deckexportall: {
						showText: true
					}
				}
			});
			view.$el.find('.actions-container').append(actionsTemplate);

			var sortItems = [];
			_.each([ [ 'createDate', 'core.createDate' ], [ 'modifyDate', 'core.modifyDate' ], [ 'name', 'core.name' ],
					[ 'warlord', 'core.warlord' ], [ 'cardsQuantity', 'core.cardsQuantity' ],
					[ 'armyCardsQuantity', 'core.cardsQuantity.army' ],
					[ 'attachmentCardsQuantity', 'core.cardsQuantity.attachment' ],
					[ 'eventCardsQuantity', 'core.cardsQuantity.event' ],
					[ 'supportCardsQuantity', 'core.cardsQuantity.support' ] ], function(arr) {
				sortItems.push({
					value: arr[0],
					label: ordb.dict.messages[arr[1]]
				})
			});
			view.deckListFilterView = new _deck.DeckListFilterView({
				config: {
					showCreateDate: true,
					showModifyDate: true,
					sortItems: sortItems
				}
			});
			view.deckListFilterView.state.on('change:advanced', function(state) {
				view.filterAdvanced = state.get('advanced');
			});
			view.deckListFilterView.render({
				filter: view.filter,
				advanced: view.filterAdvanced,
				searchClickHandler: queryDeckList
			});
			view.deckListDataView = new _deck.DeckListDataView();
			if (view.decks.length > 0) {
				view.deckListDataView.render(view.decks, {
					pageClickHandler: queryDeckList,
					pageNumber: view.pageNumber
				});
			} else {
				queryDeckList();
			}
		}
	});

	/**
	 * Deck edit view
	 */
	_deck.UserDeckEditView = _deck.PageViewBase.extend({
		el: '.content',
		
		/**
		 * @memberOf UserDeckEditView
		 */
		events: function() {
			return _.extend({
				/*'click .user-deck-edit-view a': 'onViewLinkClick',*/
				'click .user-deck-edit-view .select-one .btn': 'onSelectOneGroupClick',
				'click .user-deck-edit-view .select-many .btn': 'onSelectManyGroupClick',
				'click .user-deck-edit-view .layout-group .btn': 'onLayoutClick',
				'click .user-deck-edit-view .filter-sphere .btn': 'onSphereFilterClick',
				'click .user-deck-edit-view .filter-card-type .btn': 'onCardTypeFilterClick',
				'click .user-deck-edit-view .filter-selection .btn': 'onSelectionFilterClick',
				'change .user-deck-edit-view .sort-control': 'onSortControlChange',
				'click .user-deck-edit-view .btn.deck-save': 'onDeckSaveClick',
				'click .user-deck-edit-view .btn.deck-save-copy': 'onDeckSaveCopyClick',
				'click .user-deck-edit-view .btn.deck-delete': 'onDeckDeleteClick',
				'click .user-deck-edit-view .btn.deck-publish': 'onDeckPublishClick'
			}, _deck.PageViewBase.prototype.events.call(this));
		},

		initialize: function(options) {
			var view = this;
			
			this.config = new Backbone.Model({
				membersLayout: 'list',
				membersReadOnly: false
			});
			this.membersFilter = new _deck.MembersFilter();
			this.membersSorter = new Backbone.Model();

			_.bindAll(this, 'initializeSubviews', 'render');
			
			if (options.deck) {
				// Deck data is available: via deck list view or via deck import view. Fetch its
				// detail data. Render appropriate views on success.
				this.deck = options.deck;
				this.deck.get('snapshots').fetch({
					data: {
						snapshotBaseId: this.deck.get('id')
					},
					success: function(decks, response, options) {
						view.renderPublishedDecksList.call(view);
					}
				});
				this.deck.get('links').fetch({
					success: function(links, response, options) {
						view.renderPrivateLinksList.call(view);
					}
				});
				this.deck.fillMissingMembers();	// probably not neeeded
				this.deck.adjustMembersQuantities();		// probably not neeeded
				this.initializeSubviews();
			} else if (options.deckId) {
				// Deck data is not available. Fetch it. Render whole view on success. Render error
				// message on error.
				this.deck = new ordb.model.PrivateDeck({
					id: options.deckId
				});
				this.deck.set('loading', {});
				this.deck.fetch({
					success: function(deck, response, options) {
						deck.fillMissingMembers();
						deck.adjustMembersQuantities();
						view.initializeSubviews();
						view.deck.unset('loading');
						view.render();
					},
					error: function(deck, response, options) {
						view.messages = _deck.buildErrorMessage({
							error: response.responseJSON,
							message: 'error.deck.oper.loadDeck'
						});
						view.renderMessages();
					}
				});
			} else {
				// Build a new deck.
				this.deck = new ordb.model.PrivateDeck({
					type: 'base',
					members: _deck.getPlayerDeckMembers(),
					coreSetQuantity: 3,
					name: _.reduce(_.range(10), function(memo, index) {
						return memo + String.fromCharCode(_.random(65, 90));
					}, 'deck_')
				}, {
					parse: true
				});
				
				this.initializeSubviews();
			}

			this.listenTo(this.deck, 'invalid', function(deck) {
				this.messages = [ {
					kind: 'danger',
					title: 'core.error',
					message: deck.validationError
				} ];
				this.renderMessages();
			});

			// bind handlers for filter change, sort change
			this.listenTo(this.membersFilter, 'change', this.filterMembers);
			this.listenTo(this.membersSorter, 'change', this.sortMembers);
			
			this.bindMenuLinkClickHandler();
		},
		
		initializeSubviews: function() {
			var partialViewOptions = {
				deck: this.deck,
				config: this.config
			};
			// heroes view
			this.heroesView = new _deck.DeckHeroesView(partialViewOptions);
			// members groups view
			this.membersGroupsView = new _deck.MembersGroupsView(partialViewOptions);
			// members list view
			this.membersListView = new _deck.MembersListView(partialViewOptions);
			// description view
			this.deckDescriptionView = new _deck.DeckDescriptionView(partialViewOptions);
			// deck draw view
			this.deckDrawView = new _deck.DeckDrawView(partialViewOptions);
			
			// Listen to quantity change event on each member separately.
			this.deck.getMembers().each(function(member) {
				this.listenTo(member, 'change:quantity', function(member, quantity, options) {
					this.deck.history.add({
						member: member,
						quantity: quantity
					});
					this.renderStatistics();
				});
			}, this);
			
			// Listen to quantity of core sets change event. Adjust quantities of deck
			// cards accordingly and update deck statistics.
			this.listenTo(this.deck, 'change:coreSetQuantity', function(deck) {
				this.deck.adjustMembersQuantities();
				this.renderStatistics();
			}, this);
		},

		render: function() {
			
			if (this.deck.get('loading')) {
				this.$el.html(Handlebars.templates['user-deck-edit-view']());
				return this;
			}
			
			ordb.ui.adjustWrapperStyle();

			// Render this view.
			var deckId = this.deck.get('id');
			var deckTechName = this.deck.get('techName');
			var template = Handlebars.templates['user-deck-edit-view']({
				deck: this.deck.toJSON(),
				actions: {
					decknew: {},
					deckimport: {},
					deckexport: _.isNumber(deckId) ? {
						id: deckId
					} : undefined,
					deckview: _.isNumber(deckId) ? {
						id: deckId,
						techName: deckTechName
					} : undefined,
					decksave: {
						showText: true
					},
					deckdelete: _.isNumber(deckId) ? {} : undefined,
					decklist: {},
				},
				filterItems: {
					spheres: ordb.dict.spheres,
					cardTypes: ordb.dict.getPlayerDeckCardTypes()
				},
				sortItems: ordb.util.buildCardSortItems({
					includeEDAttrs: false,
					includeQDAttrs: false
				})
			});
			this.$el.html(template);
			this.makeTooltips();

			// If there's no filter set, set the default.
			if (this.membersFilter.isEmpty()) {
				var filter;
				if (this.deck.get('id')) {
					filter = {
						quantity: [ 1, 2, 3 ]
					}
				} else {
					filter = {
						type: [ 'hero' ]
					}
				}
				this.membersFilter.set(filter, {
					silent: true
				});
			}
			
			// Reflect filter and layout on UI.
			this.applyFilterToUI();
			this.applyLayoutToUI();

			// Render sub views.
			this.renderMessages();
			var svItems = [{
				ctr: '.deck-heroes-view-ctr',
				sv: this.heroesView
			}, {
				ctr: '.members-groups-view-ctr',
				sv: this.membersGroupsView
			}, {
				ctr: '.members-list-view-ctr',
				sv: this.membersListView
			}, {
				ctr: '.deck-description-view-ctr',
				sv: this.deckDescriptionView
			}, {
				ctr: '.deck-draw-view-ctr',
				sv: this.deckDrawView
			}  ];
			_.each(svItems, function(svItem) {
				this.$el.find(svItem.ctr).empty().append(svItem.sv.render().el);
			}, this);
			this.renderPrivateLinksList();
			this.renderPublishedDecksList();
			this.renderStatistics();

//			this.listenTo(this.deck.get('snapshots'), 'add remove', this.renderPublishedDecksList);

			//
			// create private link
			//
			// this.$el.find('#createLinkButton').click(function() {
			// var attributes = new ordb.model.DeckLink({
			// deckId: view.deck.get('id'),
			// name: $('#createLinkInput').val()
			// });
			// var deckLink = new ordb.model.DeckLink();
			// deckLink.owner = view.deck.get('links').owner;
			// deckLink.save(attributes, {
			// success: function(deckLink, response, options) {
			// view.deck.get('links').unshift(deckLink);
			// view.messages = _deck.buildSuccessMessage({
			// message: 'ok.deck.oper.saveLink'
			// });
			// view.renderMessages();
			// },
			// error: function(deckLink, response, options) {
			// view.messages = _deck.buildErrorMessage({
			// error: response.responseJSON,
			// message: 'error.deck.oper.saveLink'
			// });
			// view.renderMessages();
			// }
			// });
			// });
			// this.listenTo(this.deck.get('links'), 'add remove', this.renderPrivateLinksList);

			//
			// export deck
			//
//			_deck.prepareExportModalDialog(this.deck);

			var view = this;
			//
			// config popover
			//				
			var $configTrigger = this.$el.find('#configTrigger').popover({
				html: true,
				trigger: 'click focus',
				placement: 'bottom',
				animation: false,
				content: Handlebars.templates['deck-config']({})
			});

			$configTrigger.on('shown.bs.popover', function() {
				var $configContent = view.$el.find('#configContent');
				var $coreSetQuantityRadios = $configContent.find('input[name="csQuantity"]');
				$coreSetQuantityRadios.filter('[value="' + view.deck.get('coreSetQuantity') + '"]').prop('checked', true);
				$configContent.find('#configApply').click(function() {
					$configTrigger.popover('hide');
					view.deck.set({
						coreSetQuantity: parseInt($coreSetQuantityRadios.filter(':checked').val())
					});
				});
				$configContent.find('#configCancel').click(function() {
					$configTrigger.popover('hide');
				});
			});

			//
			// filter: sets
			// 
			// TODO

			//
			// filter: stats
			// 
			// TODO

			//
			// filter: name/trait/keyword/text search bar
			//
			ordb.ui.buildCardsTypeahead(this.membersFilter, {
				selector: '#textFilter input',
				playerDeckOnly: true
			});

			this.filterMembers();
			this.bindMenuLinkClickHandler();
		},
		
		filterMembers: function() {
			var filteredMembers = this.membersFilter.filter(this.deck.getMembers());
			this.deck.getFilteredMembers().comparator = this.buildMembersComparator(this.membersSorter.get('keys'));
			this.deck.getFilteredMembers().reset(filteredMembers);
		},

		sortMembers: function() {
			this.deck.getFilteredMembers().comparator = this.buildMembersComparator(this.membersSorter.get('keys'));
			this.deck.getFilteredMembers().sort();
			this.deck.getFilteredMembers().trigger('reset', this.deck.getFilteredMembers());
		},

		applyFilterToUI: function() {
			var filter = _.pick(this.membersFilter.attributes, ordb.filter.CARD_ATTRS);

			this.$el.find('.layout-group .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.layout, $this.data('layout'))) {
					$this.addClass('active');
				}
			});
			this.$el.find('.filter-group.filter-sphere .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.sphere, $this.data('sphere'))) {
					$this.addClass('active');
				}
			});
			this.$el.find('.filter-group.filter-card-type .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.type, $this.data('card-type'))) {
					$this.addClass('active');
				}
			});
			this.$el.find('.filter-group.filter-selection .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.quantity, $this.data('selection') == 'not-selected' ? 0 : 1)) {
					$this.addClass('active');
				}
			});
		},
		
		applyLayoutToUI: function() {
			$('.btn-group.layout-group > .btn[data-layout="' + this.config.get('layout') + '"]').addClass('active');
		},
		
		// buildFilterFromUI: function() {
		// var filter = {};
		// filter.layout = this.$el.find('.btn-group-layout
		// .btn.active').map(function() {
		// return $(this).data('layout');
		// }).get();
		// filter.faction =
		// this.$el.find('.btn-group-filter.filter-faction
		// .btn.active').map(function() {
		// return $(this).data('faction');
		// }).get();
		// filter.type = this.$el.find('.btn-group-filter.filter-type
		// .btn.active').map(function() {
		// return $(this).data('type');
		// }).get();
		// filter.selection =
		// this.$el.find('.btn-group-filter.filter-selection
		// .btn.active').map(function() {
		// return $(this).data('selection');
		// }).get();
		// filter.sorting =
		// this.$el.find('.sort-control').map(function() {
		// return $(this).val();
		// });
		//
		// filter = _.extend(filter, _.pick(this.membersFilter.toJSON(),
		// 'threatCost', 'resourceCost', 'willpower', 'threat',
		// 'attack', 'defense', 'hitPoints', 'setTechName', 'name',
		// 'traits', 'keywords'));
		//
		// _.each(Object.keys(filter), function(key) {
		// var value = filter[key];
		// if (_.isString(value)) {
		// value = $.trim(value);
		// }
		// if ((_.isObject(value) || _.isString(value)) &&
		// _.isEmpty(value)) {
		// delete filter[key];
		// }
		// });
		//
		// return filter;
		// },

		renderPrivateLinksList: function() {
			var template = Handlebars.templates['deck-private-link-list']({
				deck: this.deck.toJSON()
			});
			this.$el.find('#deckPrivateLinkBlock').html(template);

			//
			// delete private link
			//
			this.$el.find('#deckPrivateLinkList .btn').click(function() {
				var linkId = parseInt($(this).closest('tr').data('id'));
				var deleteHandler = function() {
					this.deck.get('links').findWhere({
						id: linkId
					}).destroy({
						wait: true,
						success: function(link, response, options) {
							this.messages = [ {
								kind: 'success',
								title: 'core.ok',
								message: 'ok.deck.oper.deleteLink'
							} ];
							this.renderMessages();
						},
						error: function(link, response, options) {
							this.messages = _deck.buildErrorMessage({
								error: response.responseJSON,
								message: 'error.deck.oper.deleteLink'
							});
							this.renderMessages();
						}
					});
				};

				var options = {
					titleKey: 'core.deck.aboutToDeleteLink.title',
					messageKey: 'core.deck.aboutToDeleteLink.message',
					buttonYes: {
						labelKey: 'core.yes.long' + Math.floor(Math.random() * 2),
						class: 'btn-danger',
						handler: deleteHandler
					},
					buttonNo: {}
				};

				_deck.showMessageModalDialog(options);
			});
		},

		renderPublishedDecksList: function() {
			var template = Handlebars.templates['deck-published-decks-list']({
				decks: this.deck.get('snapshots').toJSON(),
				editable: true
			});
			this.$el.find('#deckPublishedDecksBlock').html(template);
			this.$el.find('#deckPublishedDecksBlock [data-toggle="tooltip"]').tooltip({
				container: 'body'
			});

			//
			// edit published deck
			//
			this.$el.find('.deck-oper-edit').click(function() {
				showDeckEditSnapshotModal(this.deck.get('snapshots').findWhere({
					id: parseInt($(this).closest('tr').data('id'))
				}), {
					success: view.renderPublishedDecksList
				});
			});

			//
			// delete published deck
			//				
			this.$el.find('.deck-oper-delete').click(function() {
				var deckId = parseInt($(this).closest('tr').data('id'));
				var deleteHandler = function() {
					this.deck.get('snapshots').findWhere({
						id: deckId
					}).destroy({
						wait: true,
						success: function(snapshot, response, options) {
							this.messages = _deck.buildSuccessMessage({
								message: 'ok.deck.oper.delete'
							});
							this.renderMessages();
						},
						error: function(snapshot, response, options) {
							this.messages = _deck.buildErrorMessage({
								error: response.responseJSON,
								message: 'error.deck.oper.delete'
							});
							this.renderMessages();
						}
					});
				};

				var options = {
					titleKey: 'core.deck.aboutToDelete.title',
					messageKey: 'core.deck.aboutToDelete.message',
					buttonYes: {
						labelKey: 'core.yes.long' + Math.floor(Math.random() * 2),
						class: 'btn-danger',
						handler: deleteHandler
					},
					buttonNo: {}
				};

				_deck.showMessageModalDialog(options);
			});
		},

		renderStatistics: function() {
			var stats = this.deck.computeMembersStatistics();
			stats.resourceCost.name = ordb.dict.messages['card.cost.sh'];
			stats.willpower.name = '<i class="db-icon db-icon-willpower"></i>';
			stats.attack.name = '<i class="db-icon db-icon-attack"></i>';
			stats.defense.name = '<i class="db-icon db-icon-defense"></i>';
			stats.hitPoints.name = ordb.dict.messages['card.hp.sh'];

			var template = Handlebars.templates['deck-stats-table']({
				stats: stats
			});
			this.$el.find('.deck-stats-view-ctr').html(template);
			this.$el.find('.deck-stats-view-ctr [data-toggle="tooltip"]').tooltip({
				container: 'body',
				trigger: 'hover click'
			});
		},

		buildMembersComparator: function(keys) {
			var hasNonDefaultKeys = _.some(keys, function(key) {
				return key && key != 'default';
			});
			if (hasNonDefaultKeys) {
				return ordb.util.buildMembersComparator(keys);
			} else {
				return ordb.util.buildMembersDefaultComparator();
			}
		},
		
		onViewLinkClick: function(event) {
			var root = ordb.static.root;
			var href = $(event.currentTarget).attr('href');
			if (href && href.indexOf(root) == 0 && !event.ctrlKey && !event.shiftKey) {
				$(event.currentTarget).tooltip('hide');
				event.preventDefault();

				var navigateHandler = function() {
					ordb.router.navigate(href.replace(ordb.static.root, ''), {
						trigger: true
					});
				};

				if (this.deck.history.length > 0) {
					var options = {
						titleKey: 'core.deck.aboutToLeave.title',
						messageKey: 'core.deck.aboutToLeave.message',
						buttonYes: {
							labelKey: 'core.yes.long' + Math.floor(Math.random() * 2),
							class: 'btn-danger',
							handler: navigateHandler
						},
						buttonNo: {}
					};
					_deck.showMessageModalDialog(options);
				} else {
					navigateHandler();
				}
			}
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

		onLayoutClick: function(e) {
			this.config.set({
				layout: $(e.currentTarget).data('layout')
			});
		},

		onSphereFilterClick: function(e) {
			this.membersFilter.set({
				sphere: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('sphere');
				}).get()
			});
		},

		onCardTypeFilterClick: function(e) {
			this.membersFilter.set({
				type: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('card-type');
				}).get()
			});
		},

		onSelectionFilterClick: function(e) {
			var quantities = _.flatten($(e.currentTarget).parent().children().filter('.active').map(function() {
				var selection = $(this).data('selection');
				if (selection === 'not-selected') {
					return 0;
				} else if (selection === 'selected') {
					return [ 1, 2, 3, 4 ];
				}
			}).get());
			this.membersFilter.set({
				quantity: quantities.length == 0 ? undefined : quantities
			});
		},

		onSortControlChange: function(e) {
			this.membersSorter.set({
				keys: ordb.util.buildSortKeys($('.sort-control'))
			});
		},

		onDeckSaveClick: function(e) {
			var view = this;
			var attrs = {
				name: view.deckDescriptionView.$el.find('#deckName').val().trim(),
				description: view.deckDescriptionView.$el.find('#deckDescription').val().trim()
			};
			view.deck.save(attrs, {
				success: function(deck, response, options) {
					ordb.router.navigate('edit/' + deck.get('id') + '-' + deck.get('techName'));
					if (!view.deck.get('id')) {
						ga('set', 'page', ordb.static.root + 'edit/' + parseInt(deck.get('id')));
					}
					ga('send', 'pageview');
					view.deck = deck;
					view.deck.history.reset();
					view.messages = _deck.buildSuccessMessage({
						message: 'ok.deck.oper.save'
					});
					view.initializeSubviews();
					view.render();
				},
				error: function(deck, response, options) {
					view.messages = _deck.buildErrorMessage({
						error: response.responseJSON,
						message: 'error.deck.oper.save'
					});
					view.renderMessages();
				}
			});
		},

		onDeckSaveCopyClick: function(e) {
			_deck.showDeckSaveCopyModal(this.deck);
		},

		onDeckDeleteClick: function(e) {
			var view = this;
			var deleteHandler = function() {
				view.deck.destroy({
					wait: true,
					success: function(deck, response, options) {
						ordb.router.navigate('');
						ga('set', 'page', ordb.static.root);
						ga('send', 'pageview');
						userDeckListView.messages = _deck.buildSuccessMessage({
							message: 'ok.deck.oper.delete'
						});
						delete view.deck;
						userDeckListView.render();
					},
					error: function(deck, response, options) {
						view.messages = _deck.buildErrorMessage({
							error: response.responseJSON,
							message: 'error.deck.oper.delete'
						});
						view.renderMessages();
					}
				});
			};

			var options = {
				titleKey: 'core.deck.aboutToDelete.title',
				messageKey: 'core.deck.aboutToDelete.message',
				buttonYes: {
					labelKey: 'core.yes.long',
					class: 'btn-danger',
					handler: deleteHandler
				},
				buttonNo: {}
			};

			_deck.showMessageModalDialog(options);
		},

		onDeckPublishClick: function(e) {
			_deck.showDeckPublishModal(this.deck);
		}
	});

	_deck.UserDeckImportView = _deck.PageViewBase.extend({
		events: {
			'click .user-deck-import-view a': 'viewLinkClickHandler'
		},

		/**
		 * @memberOf UserDeckImportView
		 */
		render: function(id) {
			var view = this;

			var template = Handlebars.templates['user-deck-import-view']();
			var actionsTemplate = Handlebars.templates['deck-actions']({
				actions: {
					decknew: {
						showText: true
					},
					decklist: {
						showText: true
					}
				}
			});
			view.$el.html(template);
			view.$el.find('.actions-container').append(actionsTemplate);
			ordb.ui.adjustWrapperStyle();

			view.membersGroupsView = new _deck.MembersGroupsView({
				el: '.mg-container'
			});

			$('#parseDeckButton').click(function() {
				var cleanName = function(name) {
					return s(name.toLowerCase()).clean().slugify().value();
				};
				var index = _.indexBy(ordb.dict.getCards(), function(card) {
					return cleanName(card.name);
				});
				var indexEn = _.indexBy(ordb.dict.getCards(), function(card) {
					return cleanName(card.nameEn);
				});
				var pattern = /(?:([1-4])x?)?([^\(\)]+)(?:\((.+)\))?/;

				var warnings = [];
				var errors = [];
				var warlordId = undefined;
				var members = [];

				var lines = s.lines($('textarea').val());

				_.each(lines, function(line) {
					if (s.isBlank(line)) {
						return;
					}
					var startsWithTypeName = _.some(ordb.dict.cardTypes, function(cardType) {
						var tmp = s(line).trim().toLowerCase();
						return tmp.startsWith(cardType.name.toLowerCase())
								|| tmp.startsWith(cardType.nameEn.toLowerCase());
					});
					if (startsWithTypeName) {
						return;
					}

					var tokens = pattern.exec(s.trim(line.toLowerCase()));
					if (tokens != null) {
						var cn = cleanName(tokens[2]);
						var card = index[cn] || indexEn[cn];
						if (_.isUndefined(card)) {
							warnings.push(ordb.dict.messages['core.skipped'] + ': ' + line);
							return;
						}

						if (card.type === 'warlord') {
							warlordId = card.id;
						} else {
							members.push({
								cardId: card.id,
								quantity: parseInt(tokens[1])
							});
						}
					} else {
						warnings.push(ordb.dict.messages['core.skipped'] + ': ' + line);
					}
				});

				if (_.isUndefined(warlordId)) {
					errors.push(ordb.dict.messages['error.deck.warlord.notFound']);
				} else {
					var pdms = _deck.getPlayerDeckMembers();
					var pdmsIndex = _.indexBy(pdms, function(pdm) {
						return pdm.cardId;
					});
					_.each(members, function(member) {
						var pdm = pdmsIndex[member.cardId];
						if (_.isUndefined(pdm)) {
							errors.push(ordb.dict.messages['error.deck.invalidCard'] + ': '
									+ ordb.dict.findCard(member.cardId).name);
						} else {
							var card = ordb.dict.findCard(member.cardId);
							if (_.isNumber(card.warlordId)) {
								pdm.quantity = card.quantity;
							} else if (_.isNumber(member.quantity)) {
								pdm.quantity = Math.max(1, Math.min(3, member.quantity));
							} else {
								pdm.quantity = 1;
							}
						}
					});
				}

				var deck = undefined;
				if (_.isUndefined(warlordId)) {
					view.$el.find('.mg-container').empty();
				} else {
					deck = new ordb.model.PrivateDeck({
						type: 'base',
						warlordId: warlordId,
						members: pdms,
						coreSetQuantity: 3
					}, {
						parse: true
					});
					view.membersGroupsView.render(deck.getMembers(), {
						membersReadOnly: false
					});
				}

				if (errors.length == 0) {
					view.$el.find('#editDeckButton').removeClass('disabled').click(function() {
						userDeckEditView.render({
							deck: deck
						});
						var warlord = ordb.dict.findCard(deck.get('warlordId'));
						ordb.router.navigate('new/' + warlord.id + '-' + warlord.techName);
					});
				} else {
					view.$el.find('#editDeckButton').addClass('disabled').off('click');
				}

				var $container = view.$el.find('.problems-container').empty();
				if (errors.length > 0) {
					$container.append(Handlebars.templates['commons-ul']({
						listTitle: ordb.dict.messages['core.errors'] + ':',
						listItems: errors,
						listContainerStyle: 'alert alert-danger'
					}));
				}
				if (warnings.length > 0) {
					$container.append(Handlebars.templates['commons-ul']({
						listTitle: ordb.dict.messages['core.warnings'] + ':',
						listItems: warnings,
						listContainerStyle: 'alert alert-warning'
					}));
				}
			});
		}
	});

})(ordb.deck);

$(function() {

	var Router = Backbone.Router.extend({
		routes: {
			'edit': 'editDeck',
			'edit/:id': 'editDeck',
			'import': 'importDeck',
			'': 'viewDecks',
		}
	});

//	var userDeckListView = new ordb.deck.UserDeckListView();
//	var userDeckImportView = new ordb.deck.UserDeckImportView();
//	var userDeckEditView = new ordb.deck.UserDeckEditView();
	
	var changeView = function(view) {
		if (ordb.app.view) {
			ordb.app.view.remove();
		}
		return ordb.app.view = view;
	};

	ordb.router = new Router();
	ordb.router.on('route:editDeck', function(deckIdWithName) {
		var options = {};

		if (deckIdWithName) {
			var deckId = /^\w+/.exec(deckIdWithName)[0];
			if (/^\d+$/.test(deckId)) {
				deckId = parseInt(deckId);
			}
			options = {
				deckId: deckId,
				deck: undefined
//				deck: userDeckListView.decks.findWhere({
//					id: deckId
//				})
			};
		}

		changeView(new ordb.deck.UserDeckEditView(options)).render();
//		userDeckEditView.render(options);
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root + 'edit/' + options.deckId);
		ga('send', 'pageview');
	}).on('route:viewDecks', function() {
		changeView(new ordb.deck.UserDeckListView()).render();
//		userDeckListView.render();
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root);
		ga('send', 'pageview');
	}).on('route:importDeck', function() {
		changeView(new ordb.deck.UserDeckImportView()).render();
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root + 'import');
		ga('send', 'pageview');
	});

	// register partials
	Handlebars.registerPartial({
		'deck-actions': Handlebars.templates['deck-actions']
	});

	ordb.static.root = '/' + ordb.static.language + '/deck/';

	Backbone.history.start({
		pushState: true,
		root: ordb.static.root
	});
});