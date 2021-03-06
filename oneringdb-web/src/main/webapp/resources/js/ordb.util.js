var ordb = ordb || {};

//
// util
//
ordb.util = ordb.util || {};
(function(_util) {

	/**
	 * @memberOf _util
	 */
	_util.toJSON = function(data) {
		var json;
		if (_.isArray(data)) {
			json = [];
			_.each(data, function(dataItem) {
				json.push(dataItem.toJSON());
			});
		} else {
			json = data.toJSON();
		}
		return json;
	};

	_util.membersGroupBy = function(data, groupKey, sortKey, groupFactory) {
		var members;
		if (data instanceof Backbone.Collection) {
			members = data.models;
		} else {
			members = data;
		}

		members = members.filter(function(member) {
			return member.get('quantity') > 0 && member.get('card').type != 'hero';
		});

		if (sortKey) {
			members = this.membersSortBy(members, sortKey);
		}

		var membersHash = _.groupBy(members, function(member) {
			if (groupKey == 'memberQuantity') {
				return member.get('quantity');
			} else {
				return member.get('card')[groupKey];
			}
		});

		var defaultGroupFactory = function(key, members) {
			var title = key;
			if (groupKey == 'memberQuantity') {
				title = key + 'x';
			} else if (groupKey == 'cost' && key == -1) {
				title = 'X';
			}
			return {
				title: title,
				members: _util.toJSON(members),
				quantity: _.reduce(members, function(totalQuantity, member) {
					return totalQuantity + member.get('quantity');
				}, 0)

			};
		};

		var groups = [];
		_.each(Object.keys(membersHash), function(key) {
			groups.push((groupFactory || defaultGroupFactory)(key, membersHash[key]));
		});
		groups = groups.sort(function(one, two) {
			return one.title.localeCompare(two.title);
		});

		return groups;
	};

	_util.membersSortBy = function(input, key) {
		var members;
		if (input instanceof Backbone.Collection) {
			members = input.models;
		} else {
			members = input;
		}

		var keys;
		if (_.isArray(key)) {
			keys = key;
		} else {
			keys = [ key ];
		}
		keys.push('name');

		var stringKeys = [ 'name', 'type', 'typeDisplay', 'sphere', 'sphereDisplay' ];
		var numberKeys = [ 'memberQuantity', 'quantity', 'threatCost', 'resourceCost', 'engagementCost',
		                   'willpower', 'threat', 'attack', 'defense', 'hitPoints' ];

		var sorter = function(one, two) {
			var result = 0;
			$.each(keys, function(index, key) {
				var property;
				var descending;
				if (_.isObject(key)) {
					property = key.property;
					descending = key.descending;
				} else {
					property = key;
					descending = false;
				}
				var oneValue;
				var twoValue;
				if (property == 'memberQuantity') {
					oneValue = one.get('quantity');
					twoValue = two.get('quantity');
				} else {
					oneValue = one.get('card')[property];
					twoValue = two.get('card')[property];
				}

				if (stringKeys.indexOf(property) > -1) {
					result = oneValue.localeCompare(twoValue);
				} else if (numberKeys.indexOf(property) > -1) {
					result = (oneValue == twoValue ? 0 : (oneValue < twoValue ? -1 : 1));
				}

				if (result != 0) {
					if (descending === true) {
						result *= -1;
					}
					return false;
				}
			});

			return result;
		};

		return members.sort(sorter);
	};

	_util.membersShuffle = function(members) {
		var cards = [];
		_.each(_util.toJSON(members), function(member) {
			_.times(member.quantity, function(index) {
				cards.push(member.card);
			});
		});
		return _.shuffle(cards);
	};

	_util.buildCardResolver = function() {
		return function(input) {
			if (input instanceof ordb.model.Card) {
				return input.attributes;
			} else if (input instanceof ordb.model.DeckMember) {
				return input.get('card');
			} else if (input instanceof Backbone.Model) {
				return input.attributes;
			} else {
				return input;
			}
		};
	};

	_util.buildMembersComparator = function(keys) {
		return _util.buildCardsComparator(keys);
	};

	_util.buildMembersDefaultComparator = function() {
		return function(one, two) {
			var result = 0;

			if (one.isHero()) {
				result = -1;
			} else if (two.isHero()) {
				result = 1;
			} else {
				result = 0;
			}

			if (result == 0) {
				result = one.getCard().name.localeCompare(two.getCard());
			}
			return result;
		};
	};

	_util.buildCardsComparator = function(keys, options) {
		var options = options || {};
		var resolver = options.resolver || _util.buildCardResolver();

		var validKeys = [];
		_.each(keys, function(key) {
			if (key && key !== 'none' && key !== 'default') {
				validKeys.push(key);
			}
		});
		validKeys.push('setNumber');
		validKeys.push('number');

		var stringKeys = [ 'name', 'type', 'typeDisplay', 'sphere', 'sphereDisplay', 'setName' ];
		var numberKeys = [ 'memberQuantity', 'quantity', 'threatCost', 'engagementCost', 'resourceCost', 'willpower',
				'threat', 'attack', 'defense', 'hitPoints', 'setNumber', 'number' ];

		return function(one, two) {
			var result = 0;
			_.find(validKeys, function(key) {
				var property;
				var descending;
				if (_.isObject(key)) {
					property = key.property;
					descending = key.descending;
				} else {
					property = key;
					descending = false;
				}
				var oneValue;
				var twoValue;
				if (property == 'memberQuantity') {
					oneValue = one.get('quantity');
					twoValue = two.get('quantity');
				} else {
					oneValue = resolver(one)[property];
					twoValue = resolver(two)[property];
				}

				if (_.isUndefined(oneValue) && _.isUndefined(twoValue)) {
					result = 0;
				} else if (_.isUndefined(oneValue)) {
					result = -1;
				} else if (_.isUndefined(twoValue)) {
					result = 1;
				} else if (stringKeys.indexOf(property) > -1) {
					result = oneValue.localeCompare(twoValue);
				} else if (numberKeys.indexOf(property) > -1) {
					result = (oneValue == twoValue ? 0 : (oneValue < twoValue ? -1 : 1));
				}

				if (result != 0) {
					if (descending === true) {
						result *= -1;
					}
					return true;
				}
			});

			return result;
		};
	};

	_util.buildSortKeys = function($input) {
		var sortKeys = [];

		$input.each(function() {
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
	};

	_util.toTechName = function(input) {
		// return input.toLowerCase().replace(/[\']/g,
		// '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\ +/g, '-');
		return s(input).toLowerCase().slugify().value();
	};

	_util.buildPagination = function(options) {
		options = options || {};
		
		if (_.isUndefined(options.total)) {
			throw "Total is undefined";
		}

		var p = {
			total: options.total,
			pageNumber: _.isNumber(options.pageNumber) ? options.pageNumber : 0,
			pageSize: _.isNumber(options.pageSize) ? options.pageSize : 40,
		};

		p.pages = new Array(Math.ceil(p.total / p.pageSize));
		p.firstPage = p.pages[0];
		p.lastPage = p.pages[p.pages.length - 1];
		p.singlePage = p.pages.length < 2;

		_.each(_.range(0, p.pages.length), function(number) {
			p.pages[number] = {
				number: number,
				label: "" + (number + 1),
				active: number == p.pageNumber
			};
		});
		p.prevPage = p.pageNumber > 0 ? {
			number: p.pageNumber - 1
		} : undefined;
		p.nextPage = p.pageNumber < p.pages.length - 1 ? {
			number: p.pageNumber + 1
		} : undefined;

		p.pageStartIndex = p.pageNumber * p.pageSize;
		p.pageEndIndex = Math.min(p.pageStartIndex + p.pageSize, p.total) - 1;

		return p;
	};

	_util.buildCardSortItems = function(options) {
		options = options || {};

		var pdAttrs = [ 'threatCost', 'resourceCost', 'willpower' ];
		var edAttrs = [ 'engagementCost', 'threat', 'victoryPoints' ];
		var qdAttrs = [ 'questPoints' ];
		var includePDAttrs = options.includePDAttrs || true;
		var includeEDAttrs = options.includeEDAttrs || true;
		var includeQDAttrs = options.includeQDAttrs || true;

		var sortItems = [];
		_.each([ 
			 [ 'name', 'card.name' ], 
			 [ 'number', 'card.number' ], 
			 [ 'sphereDisplay', 'card.sphere' ],
			 [ 'typeDisplay', 'card.type' ], 
			 [ 'threatCost', 'card.threatCost.sh' ],
			 [ 'engagementCost', 'card.engagementCost.sh' ], 
			 [ 'resourceCost', 'card.resourceCost.sh' ], 
			 [ 'willpower', 'card.willpower' ], 
			 [ 'threat', 'card.threat' ], 
			 [ 'attack', 'card.attack' ],
			 [ 'defense', 'card.defense' ], 
			 [ 'hitPoints', 'card.hp.sh' ], 
			 [ 'setName', 'core.setName' ],
			 [ 'setNumber', 'core.setNumber' ] 
			 ], function(item) {
			if (includePDAttrs == false && pdAttrs.indexOf(item[0]) > -1 || includeEDAttrs == false
					&& edAttrs.indexOf(item[0]) > -1 || includeQDAttrs == false && qdAttrs.indexOf(item[0]) > -1) {
				return;
			}

			sortItems.push({
				value: item[0],
				label: ordb.dict.messages[item[1]]
			})
		});

		return sortItems;
	};

})(ordb.util);