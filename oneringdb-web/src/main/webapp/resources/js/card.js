var conquest = conquest || {};
conquest.card = conquest.card || {};

(function(_card) {

	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		options.url = conquest.static.restPath + options.url + '?language=' + conquest.static.language;
	});
	
	/**
	 * @memberOf _card
	 */
	_card.dummy = function() {};

	_card.ViewBase = Backbone.View.extend({
		el: '.content',
		events: function() {
			return {
				'click a': 'linkClick'
			};
		},
		remove: function() {
			this.undelegateEvents();
			this.$el.empty();
		},
		linkClick: function(e) {
			var root = conquest.static.root;
			var href = $(e.currentTarget).attr('href');
			if (href.indexOf(root) == 0 && !event.ctrlKey && !event.shiftKey) {
				e.preventDefault();
				conquest.router.navigate(href.replace(conquest.static.root, ''), {
					trigger: true
				});
			}
		},
		renderMessages: function(options) {
			if (this.messages) {
				var $template = $(Handlebars.templates['global-messages']({
					messages: this.messages
				}));
				delete this.messages;
				this.$el.prepend($template);
				setTimeout(function() {
					$template.fadeOut("slow");
				}, 2000);
			}
		}
	});

	_card.CardView = _card.ViewBase.extend({
		render: function(setNumber, cardNumber) {
			var card = conquest.dict.findCardByNumber(setNumber, cardNumber);			
			Handlebars.registerPartial({
				'card-text-content': Handlebars.templates['card-text-content']
			});
			this.$el.html(Handlebars.templates['card-view'](card));
			conquest.router.navigate(conquest.ui.toCardRelativeUrl(card));
		}
	});

	_card.CardSearchView = _card.ViewBase.extend({
		config: new Backbone.Model({
			layout: 'grid-text-only'
		}),
		
		cardsFilter: new conquest.card.CardsFilter(),
		filteredCards: new conquest.model.Cards(),
		
		events: function() {
			return _.extend({
				'click .btn-group.select-many > .btn':					'onSelectManyFilterClick',
				'click .btn-group.select-many.filter-sphere > .btn':	'onSphereFilterClick',
				'click .btn-group.select-many.filter-card-type > .btn':	'onCardTypeFilterClick',
				'click .btn-group.select-many.filter-quantity > .btn':	'onQuantityFilterClick',
				'click #cardSetFilterTrigger':							'openCardSetFilterModal'
			}, _card.ViewBase.prototype.events.call(this));
		},
		
		onSelectManyFilterClick: function(event) {
			console.log('onSelectManyFilterClick');
			
			var $this = $(event.currentTarget);
			if (event.ctrlKey) {
				$this.addClass('active').siblings().removeClass('active');
			} else {
				$this.toggleClass('active');
			}
		},
		
		onSphereFilterClick: function(e) {
			console.log('onSphereFilterClick');
			
			this.cardsFilter.set({
				sphere: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('sphere');
				}).get()
			});
		},
		
		onCardTypeFilterClick: function(e) {
			console.log('onCardTypeFilterClick');
			
			this.cardsFilter.set({
				type: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('card-type');
				}).get()
			});
		},
		
		onQuantityFilterClick: function(e) {
			console.log('onQuantityFilterClick');
			
			this.cardsFilter.set({
				quantity: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('quantity');
				}).get()
			});
		},
		
		openCardSetFilterModal: function(e) {
			console.log('openCardSetFilterModal');
			
			var view = this;
			_card.openCardSetFilterModal({
				sets: this.cardsFilter.get('setTechName'),
				cycles: this.cardsFilter.get('cycleTechName')
			}, {
				applyFilterHandler: function(filter) {
					view.cardsFilter.set({
						setTechName: filter.sets,
						cycleTechName: filter.cycles
					});
				}
			});
		},
		
		applyFilterToUI: function(filter) {
//			this.$el.find('.btn-group-layout .btn').each(function() {
//				var $this = $(this);
//				if (_.contains(filter.layout, $this.data('layout'))) {
//					$this.addClass('active');
//				}
//			});
			this.$el.find('.btn-group.filter-sphere .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.sphere, $this.data('sphere'))) {
					$this.addClass('active');
				}
			});
			this.$el.find('.btn-group.filter-card-type .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.type, $this.data('card-type'))) {
					$this.addClass('active');
				}
			});
			this.$el.find('.btn-group.filter-quantity .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.quantity, $this.data('quantity'))) {
					$this.addClass('active');
				}
			});
//			this.$el.find('.sort-control').each(function(index) {
//				if (filter.sorting && filter.sorting.length > index) {
//					$(this).val(filter.sorting[index]);
//				}
//			});
//		
//			this.config.get('filter').set(_.pick(filter, 'cost', 'shield', 'command', 'attack', 'hitPoints', 'setTechName', 'name', 'trait', 'keyword'));
		},
		
		render: function(queryString) {
			var view = this;

			if (queryString) {
				view.cardsFilter = new conquest.card.CardsFilter(conquest.filter.queryStringToFilter(queryString));
			}

			var sortItems = [];
			_.each([
				['name', 'card.name'],
				['number', 'card.number'],
				['sphereDisplay', 'card.sphere'],
				['typeDisplay', 'card.type'],
				['cost', 'card.cost.sh'],
				['willpower', 'card.willpower'],
				['threat', 'card.threat'],
				['attack', 'card.attack'],
				['attack', 'card.defense'],
				['hitPoints', 'card.hp.sh'],
				['setName', 'core.setName'],
				['setNumber', 'core.setNumber']
			], function(arr) {
				sortItems.push({
					value: arr[0],
					label: conquest.dict.messages[arr[1]]
				})
			});

			var template = Handlebars.templates['card-search-view']({
				filter: {
					spheres: conquest.dict.spheres,
					cardTypes: conquest.dict.cardTypes
				},
				sortItems: sortItems
			});

			view.$el.html(template);
			view.renderMessages();
			view.cardSearchResultsView = new _card.CardSearchResultsView();
			view.cardSearchResultsView.listenTo(view.filteredCards, 'reset', function(filteredCards) {
				this.render(filteredCards, {
					layout: view.config.get('layout')
				});
			});
			
			view.applyFilterToUI(view.cardsFilter.toJSON());
			
			// view.$el.find('.btn-group.btn-group-layout > .btn').click(function() {
			// 	$(this).addClass('active').siblings().removeClass('active');
			// 	view.config.set({
			// 		layout: $(this).data('layout')
			// 	});
			// });


//			//
//			// filter: sets
//			// 
//			new conquest.card.CardSetFilterPopoverView({
//				filter: view.cardsFilter,
//				$trigger: view.$el.find('#cardSetfilterTrigger')
//			}).render();
//
//			//
//			// filter: stats
//			// 
//			new conquest.card.CardStatFilterPopoverView({
//				filter: view.cardsFilter,
//				$trigger: view.$el.find('#cardStatfilterTrigger')
//			}).render();

			//
			// filter: name/trait/keyword search bar
			//
			var selector = '#textFilter input';
			var $typeahead = conquest.ui.createTypeahead({
				selector: selector
			});
			var $input = $(selector);
			
			if (view.cardsFilter.has('traits')) {
				$input.val(view.cardsFilter.get('traits'))
			} else if (view.cardsFilter.has('keywords')) {
				$input.val(view.cardsFilter.get('keywords'))
			} else if (view.cardsFilter.has('techName')) {
				var card = conquest.dict.findCard(view.cardsFilter.get('techName'));
				if (card) {
					$input.val(card.name);
				}
			} else if (view.cardsFilter.has('text')) {
				$input.val(view.cardsFilter.get('text'))
			}

			var setSearchbarFilter = function(options) {
				if (options) {
					var suggestion = options.suggestion;
					var dataset = options.dataset;
					var text = options.text;

					var obj = {};
					if (suggestion && dataset) {
						if (dataset == 'cards') {
							obj['techName'] = suggestion.card.techName;
						} else if (dataset == 'traits') {
							obj['traits'] = suggestion.description;
						} else if (dataset == 'keywords') {
							obj['keywords'] = suggestion.description;
						}
					} else if (text) {
						if (!(view.cardsFilter.has('techName') || view.cardsFilter.has('traits') || view.cardsFilter.has('keywords') || view.cardsFilter.has('text'))) {
							obj['text'] = text;
						}
					} else {
						obj['techName'] = undefined;
						obj['traits'] = undefined;
						obj['keywords'] = undefined;
						obj['text'] = undefined;
					}

					view.cardsFilter.set(obj, {
						silent: true
					});
				}
			};

			$typeahead.on('typeahead:selected', function($event, suggestion, dataset) {
				console.log('selected' + $event);
				setSearchbarFilter({
					suggestion: suggestion,
					dataset: dataset
				});
			}).on('typeahead:autocompleted', function($event, suggestion, dataset) {
				console.log('autocompleted' + $event);
				setSearchbarFilter({
					suggestion: suggestion,
					dataset: dataset
				});
			}).on('typeahead:closed', function($event) {
				console.log('closed' + $event);
				setSearchbarFilter({
					text: $typeahead.typeahead('val')
				});
			}).on('typeahead:opened', function($event) {
				console.log('opened' + $event);
				setSearchbarFilter({});
			}).on('keyup', function($event) {
				if ($event.keyCode == 13) {
					$typeahead.typeahead('close');
					view.cardsFilter.trigger('change', view.cardsFilter);
				}
			});

			$('#textFilter .btn').click(function() {
				view.cardsFilter.trigger('change', view.cardsFilter);
			});

			var buildSortKeys = function() {
				var sortKeys = [];
				$('.sort-control').each(function() {
					var value = $(this).val();
					if (value) {
						if (value.indexOf(',') == -1) {
							sortKeys.push(value);
						} else {
							sortKeys.push({
								property: value.split(',')[0],
								descending: value.split(',')[1] == 'desc'
							});
						}
					}
				});
				return sortKeys;
			}; // end:buildSortKeys

			var buildCardsComparator = function() {
				return conquest.util.buildCardsComparator(buildSortKeys(), {
					resolver: function(card) {
						return card.attributes;
					}
				});
			}; // end:buildMembersComparator

			//
			// sorting change
			//
			$('.sort-control').change(function() {					
				view.filteredCards.comparator = buildCardsComparator();
				view.filteredCards.sort();
				view.filteredCards.trigger('reset', view.filteredCards);
			});
			
			$('.layout-control').change(function(event) {
				view.config.set('layout', this.value);
				view.filteredCards.trigger('reset', view.filteredCards);
			});

			//
			// listen to filter change event
			//
			view.cardsFilter.listenTo(view.cardsFilter, 'change', function(cardsFilter, options) {
				view.filteredCards.comparator = buildCardsComparator();
				view.filteredCards.reset(cardsFilter.filter.call(cardsFilter, conquest.dict.cards));
				var queryString = conquest.filter.filterToQueryString(cardsFilter.toJSON());
				if (queryString && queryString.length > 0) {
					queryString = '?' + queryString;
				} else {
					queryString = '';
				}
				conquest.router.navigate('search' + queryString);
			});

			if (view.cardsFilter.isNotEmpty()) {
				view.cardsFilter.trigger('change', view.cardsFilter, {
					ga: false
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
	
	_card.CardSearchResultsView = _card.ViewBase.extend({
		el: '.card-search-results-container',
		render: function(cards, options) {
			var view = this;

			var layout = options.layout;
			var templateName = undefined;
			if (layout === 'grid-2') {
				templateName = 'card-search-results-grid-2';
			} else if (layout === 'grid-3') {
				templateName = 'card-search-results-grid-3';
			} else if (layout === 'grid-4') {
				templateName = 'card-search-results-grid-4';
			} else if (layout === 'grid-6') {
				templateName = 'card-search-results-grid-6';
			} else if (layout === 'grid-image-only') {
				templateName = 'card-search-results-grid-4';
			} else if (layout === 'grid-text-only') {
				templateName = 'card-search-results-grid-3-text';
			} else {
				// list layout is the default
				templateName = 'card-search-results-list';
			}
			
			var renderPage = function(cards, options) {
				
				options = options || {};
				
				var pagination = conquest.util.buildPagination({
					total: cards.size(),
					pageNumber: options.pageNumber,
					pageSize: 60
				});
				
				Handlebars.registerPartial({
					'pagination': Handlebars.templates['pagination'],
					'card-text-content': Handlebars.templates['card-text-content']
				});
				
				var template = Handlebars.templates[templateName]({				
					results: {
						cards: cards.toJSON().slice(pagination.pageStartIndex, pagination.pageEndIndex + 1)
					},
					pagination: pagination
				});
				view.$el.html(template);
				
				view.$el.find('.pagination-container a[data-page-number]').click(function(event) {
					renderPage(cards, {
						pageNumber: parseInt($(this).data("page-number"))
					});
					event.preventDefault();
				});
			};
			
			renderPage(cards, 0);
		}
	});
	
})(conquest.card);

$(function() {
	var Router = Backbone.Router.extend({
		routes: {
			':setNumber/:cardNumber': 'viewCard',
			'search(?:queryString)': 'searchCards'
		}
	});

	conquest.router = new Router();
	conquest.router.on('route:viewCard', function(setNumber, cardNumber) {
		if (conquest.app.view) {
			conquest.app.view.remove();
		}
		conquest.app.view = new conquest.card.CardView();
		setNumber = parseInt(setNumber);
		cardNumber = parseInt(cardNumber);
		conquest.app.view.render(setNumber, cardNumber);
		$('html,body').scrollTop(0);

		var card = conquest.dict.findCardByNumber(setNumber, cardNumber);
		var url = conquest.ui.toCardRelativeUrl(card);
		if (_.isUndefined(url)) {
			url = setNumber + '/' + cardNumber;
		}
		ga('set', 'page', conquest.static.root + url);
		ga('send', 'pageview');
	}).on('route:searchCards', function(queryString) {
		if (conquest.app.view) {
			conquest.app.view.remove();
		}
		conquest.app.view = new conquest.card.CardSearchView();
		conquest.app.view.render(queryString);
		$('html,body').scrollTop(0);
		ga('set', 'page', conquest.static.root + 'search');
		ga('send', 'pageview');
	});

	conquest.static.root = '/' + conquest.static.language + '/card/';

	Backbone.history.start({
		pushState: true,
		root: conquest.static.root
	});
});