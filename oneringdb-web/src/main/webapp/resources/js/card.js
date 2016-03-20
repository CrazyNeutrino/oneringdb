var ordb = ordb || {};
ordb.card = ordb.card || {};

(function(_card) {

	/**
	 * @memberOf _card
	 */
	_card.dummy = function() {};

	_card.CardView = ordb.view.PageView.extend({
		className: 'card-view',
			
		/**
		 * @memberOf CardView
		 */
		initialize: function() {
			this.rebindMenuLinkClickHandler();
		},
		
		render: function(setNumber, cardNumber) {
			var card = ordb.dict.findCardByNumber(setNumber, cardNumber);			
			this.$el.html(Handlebars.templates['card-view'](card));
			ordb.router.navigate(ordb.ui.toCardRelativeUrl(card));
			
			return this;
		}
	});

	_card.CardSearchView = ordb.view.PageView.extend({
		className: 'card-search-view',
		
		events: function() {
			return _.extend({
				'click .select-many .btn':		'onSelectManyFilterClick',
				'click .filter-sphere .btn':	'onSphereFilterClick',
				'click .filter-card-type .btn':	'onCardTypeFilterClick',
				'click .filter-quantity .btn':	'onQuantityFilterClick',
				'change .layout-control':		'onLayoutControlChange',
				'change .sort-control':			'onSortControlChange',
				'click #cardSetFilterTrigger':	'openCardSetFilterModal'
			}, ordb.view.View.prototype.events.call(this));
		},
		
		/**
		 * @memberOf CardSearchView
		 */
		initialize: function(options) {
			options = options || {};
			
			_.bindAll(this, 'render', 'filterCards', 'sortCards', 'applyStateToUI', 'applyStateToURL');
			
			this.config = new Backbone.Model({
				layout: 'grid-image-only'
			});
			this.queryString = options.queryString
			if (this.queryString) {
				this.cardsFilter = new ordb.card.CardsFilter(ordb.filter.queryStringToFilter(this.queryString));
			} else {
				this.cardsFilter = new ordb.card.CardsFilter();
			} 
			this.cardsSorter = new Backbone.Model();
			this.filteredCards = new ordb.model.Cards();
			
			// Listen to card filter change event. Then filter cards and change URL, to
			// reflect current filter.
			this.listenTo(this.cardsFilter, 'change', function(cardsFilter) {
				this.filterCards();
				this.applyStateToURL();
			});
			// Listen to sorter change event. Then sort cards.
			this.listenTo(this.cardsSorter, 'change', this.sortCards);
			
			this.resultsView = new _card.CardSearchResultsView({
				filteredCards: this.filteredCards,
				config: this.config
			});
			
			this.rebindMenuLinkClickHandler();
		},
		
		render: function() {
			var template = Handlebars.templates['card-search-view']({
				filter: {
					spheres: ordb.dict.spheres,
					cardTypes: ordb.dict.cardTypes
				},
				sortItems: ordb.util.buildCardSortItems()
			});

			this.$el.html(template);
			this.$el.find('.card-search-results-view-ctr').empty().append(this.resultsView.render().el);
			this.renderMessages();
			
			this.applyStateToUI(this.cardsFilter.toJSON());
			this.makeTooltips();
			
			//
			// filter: stats
			//
			// TODO

			//
			// filter: name/trait/keyword/text search bar
			//
			var $typeahead = ordb.ui.buildCardsTypeahead(this.cardsFilter, {
				selector: '#textFilter input'
			});

//			this.filterCards();
			
			return this;
		},
		
		filterCards: function() {
			var filteredCards = this.cardsFilter.filter(ordb.dict.getCards());
			this.filteredCards.comparator = ordb.util.buildCardsComparator(this.cardsSorter.get('keys'));
			this.filteredCards.reset(filteredCards);
		},
		
		sortCards: function() {
			this.filteredCards.comparator = ordb.util.buildCardsComparator(this.cardsSorter.get('keys'));
			this.filteredCards.sort();
			this.filteredCards.trigger('reset', this.filteredCards);
		},
		
		applyStateToUI: function(filter) {
			this.$el.find('.btn-group-layout .btn').each(function() {
				var $this = $(this);
				if (_.contains(filter.layout, $this.data('layout'))) {
					$this.addClass('active');
				}
			});
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
		
		applyStateToURL: function() {
			var queryString = ordb.filter.filterToQueryString(this.cardsFilter.toJSON());
			if (queryString && queryString.length > 0) {
				queryString = '?' + queryString;
			} else {
				queryString = '';
			}
			ordb.router.navigate('card/search' + queryString);
		},
		
		onSelectManyFilterClick: function(event) {
			var $target = $(event.currentTarget);
			if (event.ctrlKey) {
				$target.addClass('active').siblings().removeClass('active');
			} else {
				$target.toggleClass('active');
			}
		},
		
		onSphereFilterClick: function(e) {
			this.cardsFilter.set({
				sphere: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('sphere');
				}).get()
			});
		},
		
		onCardTypeFilterClick: function(e) {
			this.cardsFilter.set({
				type: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('card-type');
				}).get()
			});
		},
		
		onQuantityFilterClick: function(e) {
			this.cardsFilter.set({
				quantity: $(e.currentTarget).parent().children().filter('.active').map(function() {
					return $(this).data('quantity');
				}).get()
			});
		},
		
		onLayoutControlChange: function(e) {
			this.config.set({
				layout: $(e.currentTarget).val()
			});
		},
		
		onSortControlChange: function(e) {
			this.cardsSorter.set({
				keys: ordb.util.buildSortKeys($('.sort-control'))
			});
		},
		
		openCardSetFilterModal: function(e) {
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
		}
	});
	
	_card.CardSearchResultsView = ordb.view.View.extend({
		className: 'card-search-results-view',
		
		/**
		 * @memberOf CardSearchResultsView
		 */
		initialize: function(options) {
			this.filteredCards = options.filteredCards;
			this.config = options.config;
			
			_.bindAll(this, 'render');
			
			this.listenTo(this.filteredCards, 'reset', function() {
				this.render({
					pageNumber: 0
				});
			});
			this.listenTo(this.config, 'change:layout', this.render);
		},
		
		render: function(options) {
			options = options || {};
			
			var layout = this.config.get('layout');
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
			
			this.pageNumber = _.isNumber(options.pageNumber) ? options.pageNumber : this.pageNumber;
			
			var pg = ordb.util.buildPagination({
				total: this.filteredCards.size(),
				pageNumber: this.pageNumber,
				pageSize: 60
			});
			
			var template = Handlebars.templates[templateName]({				
				results: {
					cards: this.filteredCards.toJSON().slice(pg.pageStartIndex, pg.pageEndIndex + 1)
				},
				pagination: pg
			});
			this.$el.html(template);
			
			var view = this;
			this.$el.find('.pagination-container a[data-page-number]').click(function(e) {
				view.render({
					pageNumber: parseInt($(this).data('page-number'))
				});
				e.preventDefault();
			});
			
			return this;
		}
	});
	
})(ordb.card);

//$(function() {
//	var Router = Backbone.Router.extend({
//		routes: {
//			':setNumber/:cardNumber': 'viewCard',
//			'search(?:queryString)': 'searchCards'
//		}
//	});
//
//	ordb.router = new Router();
//	ordb.router.on('route:viewCard', function(setNumber, cardNumber) {
//		if (ordb.app.view) {
//			ordb.app.view.remove();
//		}
//		ordb.app.view = new ordb.card.CardView();
//		setNumber = parseInt(setNumber);
//		cardNumber = parseInt(cardNumber);
//		ordb.app.view.render(setNumber, cardNumber);
//		$('html,body').scrollTop(0);
//
//		var card = ordb.dict.findCardByNumber(setNumber, cardNumber);
//		var url = ordb.ui.toCardRelativeUrl(card);
//		if (_.isUndefined(url)) {
//			url = setNumber + '/' + cardNumber;
//		}
//		ga('set', 'page', ordb.static.root + url);
//		ga('send', 'pageview');
//	}).on('route:searchCards', function(queryString) {
//		if (ordb.app.view) {
//			ordb.app.view.remove();
//		}
//		ordb.app.view = new ordb.card.CardSearchView();
//		ordb.app.view.render(queryString);
//		$('html,body').scrollTop(0);
//		ga('set', 'page', ordb.static.root + 'search');
//		ga('send', 'pageview');
//	});
//	
//	Handlebars.registerPartial({
//		'pagination': Handlebars.templates['pagination'],
//		'card-text-content': Handlebars.templates['card-text-content'],
//		'common-ul-tree': Handlebars.templates['common-ul-tree']
//	});
//
//	ordb.static.root = '/' + ordb.static.language + '/card/';
//
//	Backbone.history.start({
//		pushState: true,
//		root: ordb.static.root
//	});
//});