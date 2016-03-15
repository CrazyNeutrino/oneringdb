var ordb = ordb || {};
ordb.card = ordb.card || {};

(function(_card) {
	
	/**
	 * @memberOf _card
	 */
	_card.openCardSetFilterModal = function(filter, options) {
		options = options || {};
		
		var $modal = $('#cardSetFilterModal');
		if ($modal.length > 0) {
			$modal.data('bs.modal', null);
		}
		
		var view = new _card.CardSetFilterView({
			excludeNightmare: options.excludeNightmare 
		});
		view.applyFilterToUI(filter);
		$modal = $(Handlebars.templates['card-set-filter-modal']());
		$modal.find('.card-set-filter-view-ctr').empty().append(view.render().el);

		if (options.applyFilterHandler) {
			$modal.find('#applyFilter').click(function() {
				$modal.modal('hide');
				options.applyFilterHandler(view.buildFilterFromUI());
			});
		}

		$modal.modal();
	};

	_card.CardsFilter = Backbone.Model.extend({
		/**
		 * @memberOf CardsFilter
		 */
		initialize: function(attributes, options) {
			_.bindAll(this, 'filter', 'isEmpty');
		},
		
		filter: function(cards) {
			var db = TAFFY(cards);
			var query = {};
			var query2;

			_.each(ordb.filter.fds, function(fd) {
				var value = this.get(fd.key);
				if (fd.type === ordb.filter.FD_TYPE_SET) {					
					if (value && value.length > 0) {
						query[fd.key] = value;
					}
				} else if (fd.type === ordb.filter.FD_TYPE_RANGE_STAT) {
					if (value && (value.length == 2 || value.length === 3 && value[2] !== true)) {
						query[fd.key] = {
							gte: value[0],
							lte: value[1]
						};
					}
				} else if (fd.type === ordb.filter.FD_TYPE_SIMPLE/* && fd.key != 'anyText'*/) {
					if (value) {
						var obj = {};
						obj[fd.oper] = value;
						query[fd.key] = obj;
					}
				}
			}, this);

			/* var anyText = this.get('anyText');
			if (anyText && !(query.techName || query.keyword || query.trait)) {
				query2 = [];
				_.each(['name', 'keyword', 'trait', 'text'], function(key) {
					var obj = {};
					obj[key] = { 
						likenocase: anyText
					};
					query2.push(obj);
				});				
			} */

			if (query2) {
				return db(query, query2).get();
			} else {
				return db(query).get();
			}
		},
		
		isEmpty: function() {
			return _.isEmpty(this.toJSON());
		},
	});
	
	//
	// card set filter view
	//
	_card.CardSetFilterView = Backbone.View.extend({
		className: 'card-set-filter-view',
		
		events: {
			'click li[data-node-type="cycle"] > input[type="checkbox"]': 'onCycleCheckboxClick',
			'click li[data-node-type="cycle"] li[data-node-type="set"] > input[type="checkbox"]': 'onSetInCycleCheckboxClick',
			'click .btn-group.sets-group .btn': 'onSetsGroupClick'
		},
		
		initialize: function(options) {
			this.excludeNightmare = (options || {}).excludeNightmare;
		},
		
		onCycleCheckboxClick: function(e) {
			var $cycle = $(e.currentTarget);
			$cycle.siblings().filter('ul').find('input[type="checkbox"]').prop('checked', $cycle.prop('checked'));
		},
		
		onSetInCycleCheckboxClick: function(e) {
			var $set = $(e.currentTarget);
			var everyChecked = _.every($set.closest('ul').find('input').map(function() {
				return $(this).prop('checked'); 
			}), function(checked) {
				return checked; 
			});
			$set.closest('ul').siblings().filter('input').prop('checked', everyChecked);
		},
		
		onSetsGroupClick: function(e) {
			var $target = $(e.currentTarget);
			$target.addClass('active').siblings().removeClass('active');
			$('.sets-group-' + $target.data('sets-group')).removeClass('hidden').siblings().addClass('hidden');
		},
		
		applyFilterToUI: function(filter) {
			var sets = filter.sets;
			var cycles = filter.cycles;
			this.$el.find('li:not(:has(ul)) input[type="checkbox"]').each(function() {
				var $this = $(this);
				$this.prop('checked', sets && sets.indexOf($this.val()) > -1);
			});
			this.$el.find('li:has(ul) > input[type="checkbox"]').each(function() {
				var $this = $(this);
				$this.prop('checked', cycles && cycles.indexOf($this.val()) > -1);
			});
		},
		
		buildFilterFromUI: function() {
			var sets = this.$el.find('li:not(:has(ul)) input[type="checkbox"]').filter(':checked').map(function() {
				return $(this).val();
			}).get()
			var cycles = this.$el.find('li:has(ul) > input[type="checkbox"]').filter(':checked').map(function() {
				return $(this).val();
			}).get();
			return {
				sets: sets,
				cycles: cycles
			}
		},
		
		/**
		 * @memberOf CardSetsFilterView
		 */
		render: function() {
			var view = this;

			var trees = ordb.dict.buildCardSetTrees();
			if (this.excludeNightmare == true) {
				delete trees.nightmare;
			}
			var template = Handlebars.templates['card-set-filter-view']({
				trees: trees,
				multiple: trees.regular && trees.nightmare
			});
			view.$el.html(template);
			
			return this;
		}
	});

//	//
//	// card stats filter popover
//	//
//	_card.CardStatFilterPopoverView = Backbone.View.extend({
//		initialize: function(options) {
//			this.filter = options.filter;
//			this.$trigger = options.$trigger;
//		},
//		render: function() {
//			var view = this;
//
//			var filterContent = Handlebars.templates['card-stat-filter-popover-view']({});
//			view.$trigger.popover({
//				html: true,
//				trigger: 'click focus',
//				placement: 'bottom',
//				animation: true,
//				content: filterContent
//			});
//
//			view.$trigger.on('shown.bs.popover', function() {
//				var $content = view.$trigger.parent().find('.filter-content');
//
//				$content.find('.slider').slider({}).each(function() {
//					var $this = $(this);
//					var $labelMin = $this.siblings().find('.label-min');
//					var $labelMax = $this.siblings().find('.label-max');
//
//					var filterKey = $this.data('filter-key');
//					var filterValues = view.filter.get(filterKey);
//					var minInit = $this.data('slider-min');
//					var maxInit = $this.data('slider-max');
//					var disabled = true;
//					if (filterValues) {
//						minInit = filterValues[0] || minInit;
//						maxInit = filterValues[1] || maxInit;
//						disabled = filterValues[2] === true;
//					}
//
//					$labelMin.text(minInit);
//					$labelMax.text(maxInit);
//
//					if (disabled) {
//						$this.parent('td').addClass('disabled');
//					} else {
//						$this.parent('td').removeClass('disabled');
//					}
//					$this.parent('td').prev().find('input').prop('checked', !disabled);
//
//					$this.slider({
//						range: true,
//						min: $this.data('slider-min'),
//						max: $this.data('slider-max'),
//						values: [minInit, maxInit],
//						slide: function(event, ui) {
//							$labelMin.text(ui.values[0]);
//							$labelMax.text(ui.values[1]);
//						}
//					});
//				});
//
//				$('.stats-filter-group td:nth-child(1) input').click(function() {
//					$(this).parent('td').next().toggleClass('disabled');
//				});
//
//				//
//				// filter apply
//				//
//				$content.find('.filter-apply').click(function() {
//					view.$trigger.popover('hide');
//					var filter = {};
//					$content.find('.slider').each(function() {
//						var $this = $(this);
//						var values = $this.slider('values');
//						values.push($this.parent().hasClass('disabled'));
//						filter[$this.data('filter-key')] = values;	
//					});
//					view.filter.set(filter);
//				});
//				//
//				// filter cancel
//				//
//				$content.find('.filter-cancel').click(function() {
//					view.$trigger.popover('hide');
//				});
//			});
//		}
//	});
	
})(ordb.card);