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
	 * Base view
	 */
	_deck.ViewBase = Backbone.View.extend({
		el: '.content',
		viewLinkClickHandler: function(event) {
			var root = ordb.static.root;
			var href = $(event.currentTarget).attr('href');
			if (href && href.indexOf(root) == 0 && !event.ctrlKey && !event.shiftKey) {
				$(event.currentTarget).tooltip('hide');
				event.preventDefault();
				ordb.router.navigate(href.replace(ordb.static.root, ''), {
					trigger: true
				});
			}
		},
		renderMessages: function(options) {
			_deck.renderMessages({
				$target: this.$el.find('.content-band .container .content'),
				messages: this.messages
			});
			delete this.messages;
		},
		nonViewLinkClickHandler: function(event) {
			var data = event.data;
			if (data && data.deck) {
				if (data.deck.history.length > 0) {
					event.preventDefault();

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
			}, this.nonViewLinkClickHandler);
		},
		unbindMenuLinkClickHandler: function() {
			$('.navbar a').off('click');
		}
	});

	/**
	 * Deck list view
	 */
	_deck.UserDeckListView = _deck.ViewBase.extend({
		events: {
			'click .user-deck-list-view a': 'viewLinkClickHandler'
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
			_.each([
				['createDate', 'core.createDate'],
				['modifyDate', 'core.modifyDate'],
				['name', 'core.name'],
				['warlord', 'core.warlord'],
				['cardsQuantity', 'core.cardsQuantity'],
				['armyCardsQuantity', 'core.cardsQuantity.army'],
				['attachmentCardsQuantity', 'core.cardsQuantity.attachment'],
				['eventCardsQuantity', 'core.cardsQuantity.event'],
				['supportCardsQuantity', 'core.cardsQuantity.support']
			], function(arr) {
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
	_deck.UserDeckEditView = _deck.ViewBase.extend({
		events: {
			'click .user-deck-edit-view a':							'onViewLinkClick',
			'click .user-deck-edit-view .select-one .btn':			'onSelectOneGroupClick',
			'click .user-deck-edit-view .select-many .btn':			'onSelectManyGroupClick',
			'click .user-deck-edit-view .layout-group .btn':		'onLayoutClick',
			'click .user-deck-edit-view .filter-sphere .btn':		'onSphereFilterClick',
			'click .user-deck-edit-view .filter-card-type .btn':	'onCardTypeFilterClick',
			'click .user-deck-edit-view .filter-selection .btn':	'onSelectionFilterClick',
			'change .user-deck-edit-view .sort-control':			'onSortControlChange'
		},
		
		membersFilter: new _deck.MembersFilter(),
		membersSorter: new Backbone.Model(),
		filteredMembers: new ordb.model.DeckMembers(),
		
		initialize: function() {
			this.config = new Backbone.Model({
				layout: 'list'
			});			
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
			console.log('onSelectOneGroupClick');
			
			$(event.currentTarget).addClass('active').siblings().removeClass('active');
		},
		
		onSelectManyGroupClick: function(event) {
			console.log('onSelectManyGroupClick');
			
			var $target = $(event.currentTarget);
			if (event.ctrlKey) {
				$target.addClass('active').siblings().removeClass('active');
			} else {
				$target.toggleClass('active');
			}
		},
		
		onLayoutClick: function(e) {
			console.log('onLayoutClick');
			
			this.config.set({
				layout: $(e.currentTarget).data('layout')
			});
		},
		
		onSphereFilterClick: function(e) {
			console.log('onSphereFilterClick');
			
			this.membersFilter.set({
				sphere: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('sphere');
				}).get()
			});
		},
		
		onCardTypeFilterClick: function(e) {
			console.log('onCardTypeFilterClick');
			
			this.membersFilter.set({
				type: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('card-type');
				}).get()
			});
		},
		
		onSelectionFilterClick: function(e) {
			console.log('onSelectionFilterClick');
			
			this.membersFilter.set({
				quantity: _.flatten($(e.currentTarget).parent().children().filter('.active').map(function() {
					var selection = $(this).data('selection');
					if (selection === 'not-selected') {
						return 0;
					} else if (selection === 'selected') {
						return [1, 2, 3, 4];
					}
				}).get())
			});
		},
		
		onSortControlChange: function(e) {
			console.log('onSortControlChange');
			
			this.membersSorter.set({
				keys: ordb.util.buildSortKeys($('.sort-control'))
			});
		},
		
//		buildFilterFromUI: function() {
//			var filter = {};
//			filter.layout = this.$el.find('.btn-group-layout .btn.active').map(function() {
//				return $(this).data('layout');
//			}).get();
//			filter.faction = this.$el.find('.btn-group-filter.filter-faction .btn.active').map(function() {
//				return $(this).data('faction');
//			}).get();
//			filter.type = this.$el.find('.btn-group-filter.filter-type .btn.active').map(function() {
//				return $(this).data('type');
//			}).get();
//			filter.selection = this.$el.find('.btn-group-filter.filter-selection .btn.active').map(function() {
//				return $(this).data('selection');
//			}).get();
//			filter.sorting = this.$el.find('.sort-control').map(function() {
//				return $(this).val();
//			});
//
//			filter = _.extend(filter, _.pick(this.membersFilter.toJSON(), 'threatCost', 'resourceCost', 'willpower', 'threat', 
//					'attack', 'defense', 'hitPoints', 'setTechName', 'name', 'traits', 'keywords'));
//
//			_.each(Object.keys(filter), function(key) {
//				var value = filter[key];
//				if (_.isString(value)) {
//					value = $.trim(value);
//				}
//				if ((_.isObject(value) || _.isString(value)) && _.isEmpty(value)) {
//					delete filter[key];
//				}
//			});
//
//			return filter;
//		},
		
//		applyFilterToUI: function(filter) {
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
				if (_.contains(filter.faction, $this.data('sphere'))) {
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
				if (_.contains(filter.quantity, $this.data('selection') == 'non-selected' ? 0 : 1)) {
					$this.addClass('active');
				}
			});
		},
		
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
							this.messages = [{
								kind: 'success',
								title: 'core.ok',
								message: 'ok.deck.oper.deleteLink'
							}];
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
		
		filterMembers: function() {
			console.log('filterMembers');
			
			var filteredMembers = this.membersFilter.filter(this.deck.get('members'));
			this.deck.get('filteredMembers').comparator = this.buildMembersComparator(
					this.membersSorter.get('keys'));
			this.deck.get('filteredMembers').reset(filteredMembers);
		},
		
		sortMembers: function() {
			console.log('sortMembers');
			
			this.deck.get('filteredMembers').comparator = this.buildMembersComparator(
					this.membersSorter.get('keys'));
			this.deck.get('filteredMembers').sort();
			this.deck.get('filteredMembers').trigger('reset', this.deck.get('filteredMembers'));
		},
		
		updateStats: function() {
			var stats = this.deck.computeStats();
			stats.resourceCost.name = ordb.dict.messages['card.cost.sh'];
			stats.willpower.name = '<i class="db-icon db-icon-willpower"></i>';
			stats.attack.name = '<i class="db-icon db-icon-attack"></i>';
			stats.defense.name = '<i class="db-icon db-icon-defense"></i>';
			stats.hitPoints.name = ordb.dict.messages['card.hp.sh'];

			var template = Handlebars.templates['deck-stats-table']({
				stats: stats
			});
			this.$el.find('.deck-stats-container').html(template);
			this.$el.find('.deck-stats-container [data-toggle="tooltip"]').tooltip({
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
		
		/**
		 * @memberOf UserDeckEditView
		 */
		render: function(options) {
			var view = this;

			options = options || {};

			var renderInternal = function() {
				ordb.ui.adjustWrapperStyle();
				
				// register partials
				Handlebars.registerPartial({
					'deck-actions': Handlebars.templates['deck-actions']
				});
				
				// render view
				var deckId = view.deck.get('id');
				var deckTechName = view.deck.get('techName');
				var template = Handlebars.templates['user-deck-edit-view']({
					deck: view.deck.toJSON(),
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
						cardTypes: ordb.dict.playerDeckCardTypes
					},
					sortItems: ordb.util.buildCardSortItems({
						includeEDAttrs: false,
						includeQDAttrs: false
					})
				});
				
//				var f = view.buildFilterFromUI();
				view.$el.html(template);
				if (view.membersFilter.isEmpty()) {
					view.membersFilter.set({
						type : ['hero']
					}, {
						silent: true
					});
				}
				view.applyFilterToUI();

				view.deckDescriptionView = new _deck.DeckDescriptionView();
				view.deckDescriptionView.render(view.deck);

				view.renderPrivateLinksList();
				view.renderPublishedDecksList();
				view.updateStats();
				view.renderMessages();
				
				// bind handlers for filter change, sort change
				view.membersFilter.on('change', view.filterMembers, view);
				view.membersSorter.on('change', view.sortMembers, view);

				// cards popovers
				view.$el.find('a[data-image-base]').popover({
					html: true,
					trigger: 'hover',
					content: function() {
						return ordb.ui.writeCardImgElem($(this).data('image-base'), {
							class: 'card-md'
						});
					}
				});

//				var deckId = view.deck.get('id');
//				var deckTechName = view.deck.get('techName');
//				view.$el.find('.actions-container').append(Handlebars.templates['deck-actions']({
//					actions: {
//						decknew: {},
//						deckimport: {},
//						deckexport: _.isNumber(deckId) ? {
//							id: deckId
//						} : undefined,
//						deckview: _.isNumber(deckId) ? {
//							id: deckId,
//							techName: deckTechName
//						} : undefined,
//						decksave: {
//							showText: true
//						},
//						deckdelete: _.isNumber(deckId) ? {} : undefined,
//						decklist: {},
//					}
//				}));

				// members list
				view.membersListView = new _deck.MembersListView({
					el: '.members-container',
				});
				view.membersListView.listenTo(view.deck.get('filteredMembers'), 'reset', function(filteredMembers) {
					this.render(filteredMembers, {
						layout: view.config.get('layout'),
						readOnly: false
					});
				});
				
				// members groups
				view.groupsView = new _deck.MemberGroupsView({
					el: '.mg-container'
				});
				view.deck.get('members').each(function(member) {
					view.listenTo(member, 'change:quantity', function(member, quantity, options) {
						view.deck.history.add({
							member: member,
							quantity: quantity
						});
						if (options.batchChange !== true) {
							view.groupsView.render(member.collection, {
								readOnly: false
							});
							var $members = view.membersListView.$el.find('.members-list-item, .members-grid-item');
							var $buttons = $members.filter('[data-card-id="' + member.get('cardId') + '"]').find('.btn-group-qty .btn');
							$buttons.filter('[data-quantity="' + member.get('quantity') + '"]').addClass('active').siblings().removeClass('active');
							view.updateStats();
						}
					});
				});
				view.listenTo(view.deck, 'invalid', function(deck) {
					view.messages = [{
						kind: 'danger',
						title: 'core.error',
						message: deck.validationError
					}];
					view.renderMessages();
				});
				view.listenTo(view.config, 'change:layout', function(config) {
					view.membersListView.render(view.deck.get('filteredMembers'), {
						layout: config.get('layout'),
						readOnly: false
					});
				});
				view.listenTo(view.deck, 'change:configCsQuantity', function(deck) {
					deck.adjustQuantities();
					view.membersListView.render(view.deck.get('filteredMembers'), {
						layout: view.config.get('layout'),
						readOnly: false
					});
					view.groupsView.render(view.deck.get('members'), {
						readOnly: false
					});
					view.updateStats();
				});
				
				view.groupsView.render(view.deck.get('members'), {
					readOnly: false
				});

				$('.btn-group.layout-group > .btn[data-layout="' + view.config.get('layout') + '"]').addClass('active');

				//
				// save deck
				//
				$('.btn.deck-save, a.deck-save').click(function() {
					var attributes = {
						name: view.deckDescriptionView.$el.find('#deckName').val().trim(),
						description: view.deckDescriptionView.$el.find('#deckDescription').val().trim()
					};
					var deckIdBeforeSave = view.deck.get('id');
					view.deck.save(attributes, {
						success: function(deck, response, options) {
							ordb.router.navigate('edit/' + deck.get('id') + '-' + deck.get('techName'));
							if (_.isUndefined(deckIdBeforeSave)) {
								ga('set', 'page', ordb.static.root + 'edit/' + parseInt(deck.get('id')));
							}
							ga('send', 'pageview');
							view.deck = deck;
							view.deck.history.reset();
							// view.filter = view.buildFilterFromUI();
							view.messages = _deck.buildSuccessMessage({
								message: 'ok.deck.oper.save'
							});							
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
				});

				//
				// save deck copy
				//
				$('a.deck-save-copy').click(function() {
					_deck.showDeckSaveCopyModal(view.deck);
				});

				//
				// delete deck
				//
				$('#deckDelete').click(function() {
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
							labelKey: 'core.yes.long' + Math.floor(Math.random() * 2),
							class: 'btn-danger',
							handler: deleteHandler
						},
						buttonNo: {}
					};

					_deck.showMessageModalDialog(options);
				});

				//
				// publish deck
				//
				view.$el.find('#deckPublishButton').click(function() {
					showDeckPublishModal(view.deck);
				});
				view.listenTo(view.deck.get('snapshots'), 'add remove', view.renderPublishedDecksList);

				//
				// create private link
				//
				view.$el.find('#createLinkButton').click(function() {
					var attributes = new ordb.model.DeckLink({
						deckId: view.deck.get('id'),
						name: $('#createLinkInput').val()
					});
					var deckLink = new ordb.model.DeckLink();
					deckLink.owner = view.deck.get('links').owner;
					deckLink.save(attributes, {						
						success: function(deckLink, response, options) {
							view.deck.get('links').unshift(deckLink);
							view.messages = _deck.buildSuccessMessage({
								message: 'ok.deck.oper.saveLink'
							});
							view.renderMessages();
						},
						error: function(deckLink, response, options) {							
							view.messages = _deck.buildErrorMessage({
								error: response.responseJSON,
								message: 'error.deck.oper.saveLink'
							});
							view.renderMessages();
						}
					});
				});
				view.listenTo(view.deck.get('links'), 'add remove', view.renderPrivateLinksList);

				//
				// export deck
				//
				_deck.prepareExportModalDialog(view.deck);

				//
				// tooltips
				//				
				view.$el.find('.members-list-filter-container[data-toggle="tooltip"]').tooltip({
					container: 'body'
				});

				view.$el.find('[data-toggle="tooltip"]').tooltip({
					container: 'body',
					trigger: 'hover'
				});

				//
				// config popover
				//				
				var $configTrigger = view.$el.find('#configTrigger').popover({
					html: true,
					trigger: 'click focus',
					placement: 'bottom',
					animation: false,
					content: Handlebars.templates['deck-config']({})
				});

				$configTrigger.on('shown.bs.popover', function() {
					var $configContent = view.$el.find('#configContent');
					var $configCsQuantityRadios = $configContent.find('input[name="csQuantity"]');
					$configCsQuantityRadios.filter('[value="' + view.deck.get('configCsQuantity') + '"]').prop('checked', true);
					$configContent.find('#configApply').click(function() {
						$configTrigger.popover('hide');
						view.deck.set({
							configCsQuantity: parseInt($configCsQuantityRadios.filter(':checked').val())
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
				// draw
				//				
				var $buttons = view.$el.find('.btn-group-draw .btn');
				$buttons.click(function() {
					var $drawContainer = $('.draw-container');

					var draw = function(quantity) {
						if (_.isUndefined(view.shuffledCards)) {
							view.shuffledCards = ordb.util.membersShuffle(view.deck.get('members').filter(function(member) {
								return member.get('card').type != 'hero';
							}));
							view.shuffledCardsIndex = 0;
							$drawContainer.empty();
						}

						var drawn = 0;
						while (view.shuffledCardsIndex < view.shuffledCards.length && drawn < quantity) {
							var imageBase = view.shuffledCards[view.shuffledCardsIndex].imageBase;
							var attrs = {
								class: 'card-xs'
							};
							$('<a />').data('image-base', imageBase).append(ordb.ui.writeCardImgElem(imageBase, attrs)).popover({
								html: true,
								trigger: 'hover',
								content: function() {
									return ordb.ui.writeCardImgElem($(this).data('image-base'), {
										class: 'card-md'
									});
								}
							}).appendTo($drawContainer);
							view.shuffledCardsIndex += 1;
							drawn += 1;
						}
					};

					var quantity = undefined;
					var $button = $(this);
					if ($buttons.index($button) == 0) {
						view.shuffledCards = undefined;
						quantity = 6;
					} else if ($buttons.index($button) == 1) {
						view.shuffledCards = undefined;
						quantity = view.deck.get('members').reduce(function(total, member) {
							return total + member.get('quantity');
						}, 0);
					} else {
						quantity = parseInt($button.text());
					}

					draw(quantity);
				});

				//
				// filter: name/trait/keyword/text search bar
				//
				var $typeahead = ordb.ui.buildCardsTypeahead(view.membersFilter, {
					selector: '#textFilter input'
				});

				view.filterMembers();
			};

			if (options.deck) {
				view.deck = options.deck;
				view.deck.get('snapshots').fetch({
					data: {
						snapshotBaseId: view.deck.get('id')
					},
					success: function(decks, response, options) {
						view.renderPublishedDecksList();
					}
				});
				view.deck.get('links').fetch({
					success: function(links, response, options) {
						view.renderPrivateLinksList();
					}
				});
								
				renderInternal();
			} else if (options.deckId) {
				view.deck = new ordb.model.PrivateDeck({
					id: options.deckId
				});
				view.deck.fetch({
					success: function(deck, response, options) {
						renderInternal();
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
				view.deck = new ordb.model.PrivateDeck({
					type: 'base',
					members: _deck.getPlayerDeckMembers(),
					configCsQuantity: 3
				}, {
					parse: true
				});
				renderInternal();
			}

			this.bindMenuLinkClickHandler();
		}
	});
	
	_deck.UserDeckImportView = _deck.ViewBase.extend({
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

			view.groupsView = new _deck.MemberGroupsView({
				el: '.mg-container'
			});

			$('#parseDeckButton').click(function() {
				var cleanName = function(name) {
					return s(name.toLowerCase()).clean().slugify().value();
				};
				var index = _.indexBy(ordb.dict.cards, function(card) {
					return cleanName(card.name);
				});
				var indexEn = _.indexBy(ordb.dict.cards, function(card) {
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
						return tmp.startsWith(cardType.name.toLowerCase()) || tmp.startsWith(cardType.nameEn.toLowerCase());
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
							errors.push(ordb.dict.messages['error.deck.invalidCard'] + ': ' + ordb.dict.findCard(member.cardId).name);
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
						configCsQuantity: 3						
					}, {
						parse: true
					});
					view.groupsView.render(deck.get('members'), {
						readOnly: false
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
					$container.append(
						Handlebars.templates['commons-ul']({
							listTitle: ordb.dict.messages['core.errors'] + ':',
							listItems: errors,
							listContainerStyle: 'alert alert-danger'
						})
					);
				}
				if (warnings.length > 0) {
					$container.append(
						Handlebars.templates['commons-ul']({
							listTitle: ordb.dict.messages['core.warnings'] + ':',
							listItems: warnings,
							listContainerStyle: 'alert alert-warning'
						})
					);
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

	var userDeckListView = new ordb.deck.UserDeckListView();
	var userDeckImportView = new ordb.deck.UserDeckImportView();
	var userDeckEditView = new ordb.deck.UserDeckEditView();

	ordb.router = new Router();
	ordb.router.on('route:editDeck', function(deckIdWithName) {
		var options = {};
		
		if (deckIdWithName) {
			var deckId = /^\w+/.exec(deckIdWithName)[0];
			if (/^\d+$/.test(deckId)) {
				deckId = parseInt(deckId);
			}
			options = {
				deckdId : deckId,
				deck : userDeckListView.decks.findWhere({
					id : deckId
				})
			};
		}
		
		userDeckEditView.render(options);
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root + 'edit/' + options.deckId);
		ga('send', 'pageview');
	}).on('route:viewDecks', function() {
		userDeckListView.render();
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root);
		ga('send', 'pageview');
	}).on('route:importDeck', function() {
		userDeckImportView.render();
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root + 'import');
		ga('send', 'pageview');
	});

	ordb.static.root = '/' + ordb.static.language + '/deck/';

	Backbone.history.start({
		pushState: true,
		root: ordb.static.root
	});
});