var ordb = ordb || {};
ordb.card = ordb.card || {};

(function(_card) {

	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		options.url = ordb.static.restPath + options.url + '?language=' + ordb.static.language;
	});
	
	/**
	 * @memberOf _card
	 */
	_card.dummy = function() {};

	_card.View = Backbone.View.extend({
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
			var root = ordb.static.root;
			var href = $(e.currentTarget).attr('href');
			if (href.indexOf(root) == 0 && !event.ctrlKey && !event.shiftKey) {
				e.preventDefault();
				ordb.router.navigate(href.replace(ordb.static.root, ''), {
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

	_card.CardView = _card.View.extend({
		render: function(setNumber, cardNumber) {
			var card = ordb.dict.findCardByNumber(setNumber, cardNumber);			
			this.$el.html(Handlebars.templates['card-view'](card));
			ordb.router.navigate(ordb.ui.toCardRelativeUrl(card));
		}
	});

	_card.CardSearchView = _card.View.extend({
		config: new Backbone.Model({
			layout: 'grid-text-only'
		}),
		
		cardsFilter: new ordb.card.CardsFilter(),
		filteredCards: new ordb.model.Cards(),
		
		events: function() {
			return _.extend({
				'click .select-many .btn':		'onSelectManyFilterClick',
				'click .filter-sphere .btn':	'onSphereFilterClick',
				'click .filter-card-type .btn':	'onCardTypeFilterClick',
				'click .filter-quantity .btn':	'onQuantityFilterClick',
				'click #cardSetFilterTrigger':	'openCardSetFilterModal'
			}, _card.View.prototype.events.call(this));
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
				view.cardsFilter = new ordb.card.CardsFilter(ordb.filter.queryStringToFilter(queryString));
			}

			var template = Handlebars.templates['card-search-view']({
				filter: {
					spheres: ordb.dict.spheres,
					cardTypes: ordb.dict.cardTypes
				},
				sortItems: ordb.util.buildCardSortItems()
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
			
			//
			// filter: stats
			//
			// TODO

			//
			// filter: name/trait/keyword/text search bar
			//
			var $typeahead = ordb.ui.buildCardsTypeahead(view.cardsFilter, {
				selector: '#textFilter input'
			});

			//
			// sorting change
			//
			$('.sort-control').change(function() {
				var keys = ordb.util.buildSortKeys($('.sort-control'));
				view.filteredCards.comparator = ordb.util.buildCardsComparator(keys);
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
				var keys = ordb.util.buildSortKeys($('.sort-control'));
				view.filteredCards.comparator = ordb.util.buildCardsComparator(keys);
				view.filteredCards.reset(cardsFilter.filter(ordb.dict.getCards()));
				var queryString = ordb.filter.filterToQueryString(cardsFilter.toJSON());
				if (queryString && queryString.length > 0) {
					queryString = '?' + queryString;
				} else {
					queryString = '';
				}
				ordb.router.navigate('search' + queryString);
			});

			if (!view.cardsFilter.isEmpty()) {
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
	
	_card.CardSearchResultsView = _card.View.extend({
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
				
				var pagination = ordb.util.buildPagination({
					total: cards.size(),
					pageNumber: options.pageNumber,
					pageSize: 60
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
	
})(ordb.card);

$(function() {
	var Router = Backbone.Router.extend({
		routes: {
			':setNumber/:cardNumber': 'viewCard',
			'search(?:queryString)': 'searchCards'
		}
	});

	ordb.router = new Router();
	ordb.router.on('route:viewCard', function(setNumber, cardNumber) {
		if (ordb.app.view) {
			ordb.app.view.remove();
		}
		ordb.app.view = new ordb.card.CardView();
		setNumber = parseInt(setNumber);
		cardNumber = parseInt(cardNumber);
		ordb.app.view.render(setNumber, cardNumber);
		$('html,body').scrollTop(0);

		var card = ordb.dict.findCardByNumber(setNumber, cardNumber);
		var url = ordb.ui.toCardRelativeUrl(card);
		if (_.isUndefined(url)) {
			url = setNumber + '/' + cardNumber;
		}
		ga('set', 'page', ordb.static.root + url);
		ga('send', 'pageview');
	}).on('route:searchCards', function(queryString) {
		if (ordb.app.view) {
			ordb.app.view.remove();
		}
		ordb.app.view = new ordb.card.CardSearchView();
		ordb.app.view.render(queryString);
		$('html,body').scrollTop(0);
		ga('set', 'page', ordb.static.root + 'search');
		ga('send', 'pageview');
	});
	
	Handlebars.registerPartial({
		'pagination': Handlebars.templates['pagination'],
		'card-text-content': Handlebars.templates['card-text-content'],
		'common-ul-tree': Handlebars.templates['common-ul-tree']
	});

	ordb.static.root = '/' + ordb.static.language + '/card/';

	Backbone.history.start({
		pushState: true,
		root: ordb.static.root
	});
});