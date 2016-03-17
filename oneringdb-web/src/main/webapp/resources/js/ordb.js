var ordb = ordb || {};

ordb.app = ordb.app || {};

ordb.static = ordb.static || {};
ordb.static.timezone = jstz.determine().name();
ordb.static.format = {
	en: {
		timestamp: "dddd, MMMM Do YYYY, h:mm:ss a"
	},
	pl: {
		timestamp: "dddd, Do MMMM YYYY, HH:mm:ss"
	},
	de: {
		timestamp: "dddd, Do MMMM YYYY, HH:mm:ss"
	}
};

//
// dict
//
ordb.dict = ordb.dict || {};
(function(_dict) {
	
	_dict.triggerWords = {
		de: [ 'Reise Aktion', 'Aktion', 'Erzwungen', 'Reaktion', 'Reise', 'Schatten', 'Wenn aufgedeckt' ],
		en: [ 'Travel Action', 'Action', 'Forced', 'Response', 'Riddle', 'Shadow', 'Travel', 'When Revealed' ],
		pl: [ 'Akcja wyprawy', 'Akcja', 'Cień', 'Odpowiedź', 'Podróż', 'Po odkryciu', 'Wymuszony', ]
	};
	_dict.iconWords = [ 'Willpower', 'Threat', 'Attack', 'Defense', 'Leadership', 'Tactics', 'Lore', 'Spirit',
			'Baggins', 'Fellowship' ];

	var IDX_CARD_BY_ID = "card#id";
	var IDX_CARD_BY_TECH_NAME = "card#techName";
	var IDX_CARD_BY_NAME = "card#name";
	var IDX_CARD_BY_SET_NO_CARD_NO = "card#setNumber#cardNumber";
	var IDX_CARD_SET_BY_ID = "cardSet#id";
	var IDX_CARD_TYPE_BY_TECH_NAME = "cardType#techName";
	var IDX_ENCOUNTER_SET_BY_ID = "encounterSet#id";
	var IDX_SPHERE_BY_TECH_NAME = "sphere#techName";
	var indexes = {};
	
	var playerDeckCardTypes = [];
	
	var playerDeckCards = [];
	var encounterDeckCards = [];
	var questDeckCards = [];

	/**
	 * @memberOf _dict
	 */
	_dict.initialize = function() {
		indexes[IDX_CARD_BY_ID] = _.indexBy(_dict.cards, function(card) {
			return card.id;
		});
		indexes[IDX_CARD_BY_TECH_NAME] = _.indexBy(_dict.cards, function(card) {
			return card.techName;
		});
		indexes[IDX_CARD_BY_NAME] = _.indexBy(_dict.cards, function(card) {
			return card.name;
		});
		indexes[IDX_CARD_SET_BY_ID] = _.indexBy(_dict.cardSets, function(cardSet) {
			return cardSet.id;
		});
		indexes[IDX_CARD_TYPE_BY_TECH_NAME] = _.indexBy(_dict.cardTypes, function(cardType) {
			return cardType.techName;
		});
		indexes[IDX_CARD_BY_SET_NO_CARD_NO] = _.indexBy(_dict.cards, function(card) {
			return _dict.findCardSet(card.crstId).number + '#' + card.number;
		});
		indexes[IDX_ENCOUNTER_SET_BY_ID] = _.indexBy(_dict.encounterSets, function(encounterSet) {
			return encounterSet.id;
		});
		indexes[IDX_SPHERE_BY_TECH_NAME] = _.indexBy(_dict.spheres, function(sphere) {
			return sphere.techName;
		});

		var start = new Date().getTime();
		_.each(_dict.cards, function(card) {
			if (card.text) {
				card.htmlText = ordb.ui.toHtmlText(card.text);
				card.text = ordb.ui.toPlainText(card.text);
			}

			var crst = _dict.findCardSet(card.crstId);
			card.setName = crst.name;
			card.setTechName = crst.techName;
			card.setNumber = crst.number;

			if (card.enstId) {
				var enst = _dict.findEncounterSet(card.enstId);
				card.enstName = enst.name;
				card.enstTechName = enst.techName;
			}

			switch (card.type) {
				case 'hero':
				case 'ally':
				case 'attachment':
				case 'event':
				case 'treasure':
					card.playerDeck = true;
					playerDeckCards.push(card);
					break;
				case 'enemy':
				case 'location':
				case 'treachery':
				case 'objective':
				case 'objective-ally':
				case 'objective-location':
					card.encounterDeck = true;
					encounterDeckCards.push(card);
					break;
				case 'quest':
					card.questDeck = true;
					questDeckCards.push(card);
					break;
			}

			card.hasAttrs = _.isNumber(card.threatCost) || _.isNumber(card.resourceCost)
					|| _.isNumber(card.engagementCost) || _.isNumber(card.willpower) || _.isNumber(card.threat)
					|| _.isNumber(card.attack) || _.isNumber(card.defense) || _.isNumber(card.hitPoints);

		});

		var techNames = [ 'hero', 'ally', 'attachment', 'event', 'treasure' ];
		playerDeckCardTypes = _.filter(_dict.cardTypes, function(cardType) {
			return techNames.indexOf(cardType.techName) > -1;
		});
		
		var end = new Date().getTime();
		console.log(end - start);
	};
	
	_dict.getCards = function() {
		return _dict.cards;
	};
	
	_dict.getPlayerDeckCardTypes = function() {
		return playerDeckCardTypes;
	};

	_dict.getPlayerDeckCards = function() {
		return playerDeckCards;
	};
	
	_dict.getEncounterDeckCards = function() {
		return encounterDeckCards;
	};
	
	_dict.getQuestDeckCards = function() {
		return questDeckCards;
	};

	_dict.findCardSet = function(id) {
		return _.clone(indexes[IDX_CARD_SET_BY_ID][id]);
	};

	_dict.findEncounterSet = function(id) {
		return _.clone(indexes[IDX_ENCOUNTER_SET_BY_ID][id]);
	};
	
	_dict.findSphere = function(techName) {
		return indexes[IDX_SPHERE_BY_TECH_NAME][techName];
	}

	_dict.findCard = function(idOrTechName) {
		var tmp;
		if (_.isNumber(idOrTechName)) {
			tmp = indexes[IDX_CARD_BY_ID][parseInt(idOrTechName)];
		} else {
			tmp = indexes[IDX_CARD_BY_TECH_NAME][idOrTechName];
		}
		return _.clone(tmp);
	};

	_dict.findCardByName = function(name) {
		return _.clone(indexes[IDX_CARD_BY_NAME][name]);
	};
	
	_dict.findCardByNumber = function(setNumber, cardNumber) {
		return _.clone(indexes[IDX_CARD_BY_SET_NO_CARD_NO][setNumber + '#' + cardNumber]);
	};

	_dict.findCardType = function(techName) {
		return _.clone(indexes[IDX_CARD_TYPE_BY_TECH_NAME][techName]);
	};

	_dict.getCardTypes = function() {
		return _.clone(indexes[IDX_CARD_BY_SET_NO_CARD_NO]);
	};

	_dict.findFaction = function(techName) {
		return _.clone(indexes[IDX_FACTION_BY_TECH_NAME][techName]);
	};

	_dict.getFactions = function() {
		return _.clone(indexes[IDX_FACTION_BY_TECH_NAME]);
	};

	_dict.buildCardSetTree = function() {
		var tree = {
			nodes: []
		};
		var cycleNode = undefined;

		_.each(_.sortBy(_dict.cardSets, 'sequence'), function(cardSet) {
			var nodes;
			if (cardSet.cycleTechName) {
				if (_.isUndefined(cycleNode) || cycleNode.techName !== cardSet.cycleTechName) {
					cycleNode = {
						type: 'cycle',
						name: cardSet.cycleName,
						techName: cardSet.cycleTechName,
						nodes: []
					};
					tree.nodes.push(cycleNode);
				}
				nodes = cycleNode.nodes;
			} else {
				nodes = tree.nodes;
			}

			nodes.push({
				type: 'set',
				name: cardSet.name,
				techName: cardSet.techName
			});
		});
		return tree;
	};

	_dict.buildCardSetTrees = function() {
		var trees = {
			regular: [],
			nightmare: []
		};

		var tree;
		_.each(_dict.buildCardSetTree().nodes, function(node) {
			if (node.type == 'set') {
				tree = {
					nodes: [ node ]
				};
				if (node.techName.indexOf('-nightmare') == -1) {
					trees.regular.push(tree);
				} else {
					trees.nightmare.push(tree);
				}
			} else if (node.type == 'cycle') {
				if (tree) {
					tree.nodes.push(node);
					tree = undefined;
				} else {
					if (node.techName.indexOf('-nightmare') == -1) {
						trees.regular.push({
							nodes: [ node ]
						});
					} else {
						trees.nightmare.push({
							nodes: [ node ]
						});
					}
				}
			}
		});
		return trees;
	};

})(ordb.dict);

//
// filter
//
ordb.filter = ordb.filter || {};

(function(_filter) {

	_filter.CARD_ATTRS = [ 'type', 'sphere', 'techName', 'number', 'quantity', 'name', 'traits', 'keywords', 'text',
			'threatCost', 'resourceCost', 'willpower', 'threat', 'attack', 'defense', 'hitPoints', 'setTechName',
			'enstTechName', 'anytext'];

	_filter.FD_TYPE_SET = 'set';
	_filter.FD_TYPE_SIMPLE = 'simple';
	_filter.FD_TYPE_RANGE = 'range';
	_filter.FD_TYPE_RANGE_STAT = 'range-stat';
	_filter.FD_TYPE_CUSTOM = 'custom';

	_filter.fds = [ {
		key: 'setTechName',
		queryStringKey: 'set',
		type: _filter.FD_TYPE_SET
	}, {
		key: 'enstTechName',
		queryStringKey: 'eset',
		type: _filter.FD_TYPE_SET
	}, {
		key: 'type',
		queryStringKey: 'type',
		type: _filter.FD_TYPE_SET
	}, {
		key: 'sphere',
		queryStringKey: 'sphere',
		type: _filter.FD_TYPE_SET
	}, {
		key: 'primaryFaction',
		queryStringKey: 'primaryFaction',
		type: _filter.FD_TYPE_SET
	}, {
		key: 'secondaryFaction',
		queryStringKey: 'secondaryFaction',
		type: _filter.FD_TYPE_SET
	}, {
		key: 'quantity',
		queryStringKey: 'quantity',
		type: _filter.FD_TYPE_SET,
		parseInteger: true
	}, {
		key: 'techName',
		queryStringKey: 'techName',
		type: _filter.FD_TYPE_SIMPLE,
		oper: 'isnocase'
	}, {
		key: 'name',
		queryStringKey: 'name',
		type: _filter.FD_TYPE_SIMPLE,
		oper: 'likenocase'
	}, {
		key: 'traits',
		queryStringKey: 'traits',
		type: _filter.FD_TYPE_SIMPLE,
		oper: 'likenocase'
	}, {
		key: 'keywords',
		queryStringKey: 'keywords',
		type: _filter.FD_TYPE_SIMPLE,
		oper: 'likenocase'
	}, {
		key: 'text',
		queryStringKey: 'text',
		type: _filter.FD_TYPE_SIMPLE,
		oper: 'likenocase'
	}, {
		key: 'anytext',
		queryStringKey: 'anytext',
		type: _filter.FD_TYPE_CUSTOM,
		oper: 'likenocase'
	}, {
		key: 'threatCost',
		queryStringKey: 'tc',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'resourceCost',
		queryStringKey: 'rc',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'engagementCost',
		queryStringKey: 'ec',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'wilpower',
		queryStringKey: 'wilpower',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'threat',
		queryStringKey: 'threat',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'attack',
		queryStringKey: 'attack',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'defense',
		queryStringKey: 'defense',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'hitPoints',
		queryStringKey: 'hp',
		type: _filter.FD_TYPE_RANGE_STAT
	}, {
		key: 'createDateMin',
		queryStringKey: 'createDateMin',
		type: _filter.FD_TYPE_SIMPLE
	}, {
		key: 'createDateMax',
		queryStringKey: 'createDateMax',
		type: _filter.FD_TYPE_SIMPLE
	}, {
		key: 'modifyDateMin',
		queryStringKey: 'modifyDateMin',
		type: _filter.FD_TYPE_SIMPLE
	}, {
		key: 'modifyDateMax',
		queryStringKey: 'modifyDateMax',
		type: _filter.FD_TYPE_SIMPLE
	}, {
		key: 'publishDateMin',
		queryStringKey: 'publishDateMin',
		type: _filter.FD_TYPE_SIMPLE
	}, {
		key: 'publishDateMax',
		queryStringKey: 'publishDateMax',
		type: _filter.FD_TYPE_SIMPLE
	}, {
		key: 'username',
		queryStringKey: 'username',
		type: _filter.FD_TYPE_SIMPLE,
		oper: 'isnocase'
	} ];

	/**
	 * @memberOf _filter
	 */
	_filter.filterToQueryString = function(filter) {
		var parts = [];
		_.each(_filter.fds, function(fd) {
			var value = filter[fd.key];
			if (value) {
				if (fd.type == _filter.FD_TYPE_SET && _.isArray(value) && !_.isEmpty(value)) {
					parts.push(fd.queryStringKey + '=' + value.join());
				} else if (fd.type == _filter.FD_TYPE_SIMPLE && !_.isEmpty(value)) {
					parts.push(fd.queryStringKey + '=' + value);
				} else if (fd.type == _filter.FD_TYPE_RANGE && _.isArray(value) && !_.isEmpty(value)) {
					var hasNonEmptyValue = _.some(value, function(v) {
						return !_.isUndefined(v) && v !== '';
					});
					if (hasNonEmptyValue) {
						parts.push(fd.queryStringKey + '=' + value.join());
					}
				} else if (fd.type == _filter.FD_TYPE_RANGE_STAT && _.isArray(value) && !_.isEmpty(value)) {
					if (value[2] === false) {
						parts.push(fd.queryStringKey + '=' + value.join());
					}
				}
			}
		});

		var queryString = undefined;
		if (parts.length > 0) {
			queryString = parts.join('&');
		}
		return queryString;
	};

	_filter.queryStringToFilter = function(queryString) {
		var filter = {};
		if (queryString) {
			var map = {};
			_.each(queryString.split('&'), function(part) {
				var keyValue = part.split('=');
				map[decodeURIComponent(keyValue[0])] = decodeURIComponent(keyValue[1]);
			});
			_.each(_filter.fds, function(fd) {
				var value = map[fd.queryStringKey];
				if (value) {
					if (fd.type === _filter.FD_TYPE_SET) {
						var stringValues = value.split(',');
						if (stringValues.length > 0) {
							var values = [];
							if (fd.parseInteger === true) {
								_.each(stringValues, function(stringValue) {
									values.push(parseInt(stringValue));
								});
							} else {
								values = stringValues;
							}
							filter[fd.key] = values;
						}
					} else if (fd.type === _filter.FD_TYPE_SIMPLE) {
						filter[fd.key] = value;
					} else if (fd.type === _filter.FD_TYPE_RANGE) {
						filter[fd.key] = value.split(',');
					} else if (fd.type === _filter.FD_TYPE_RANGE_STAT) {
						var values = value.split(',')
						filter[fd.key] = [ parseInt(values[0]), parseInt(values[1]), values[2] == 'true' ];
					}
				}
			});
		}

		_.each(Object.keys(filter), function(key) {
			if (_.isString(filter[key])) {
				filter[key] = $.trim(filter[key]);
			}
			if (_.isEmpty(filter[key])) {
				delete filter[key];
			}
		});
		return filter;
	};

})(ordb.filter);

//
// ui
//
ordb.ui = ordb.ui || {};
(function(_ui) {

	/**
	 * @memberOf _ui
	 */
	_ui.toCardUrl = function(input) {
		return '/' + ordb.static.language + '/card/' + _ui.toCardRelativeUrl(input);
	};

	_ui.toCardRelativeUrl = function(input) {
		var card;
		if (_.isNumber(input)) {
			card = ordb.dict.findCard(input);
		} else {
			card = input;
		}

		return s.pad(card.setNumber, 3, '0') + '-' + card.setTechName + '/' + s.pad(card.number, 3, '0') + '-'
				+ card.techName;
	};

	_ui.toPublicDeckUrl = function(options) {
		return '/' + ordb.static.language + '/public/deck/' + options.id + '-' + ordb.util.toTechName(options.name);
	};

	_ui.toUserDeckUrl = function(options) {
		var url = '/' + ordb.static.language + '/deck/edit/' + options.id;
		if (options.name) {
			url += '-' + ordb.util.toTechName(options.name);
		}
		return url;
	};

	_ui.toCardImage = function(imageBase) {
		return ordb.static.imagePath + '/card/' + imageBase + '.jpg';
	};

	_ui.toSearchLinkSphere = function(card) {
		return '<a href="/' + ordb.static.language + '/card/search?sphere=' + card.sphere + '">' + card.sphereDisplay
				+ '</a>';
	};

	_ui.toSearchLinkType = function(card) {
		return '<a href="/' + ordb.static.language + '/card/search?type=' + card.type + '">' + card.typeDisplay
				+ '</a>';
	};

	_ui.toSearchLinkSetName = function(card) {
		return '<a href="/' + ordb.static.language + '/card/search?set=' + card.setTechName + '">' + card.setName
				+ '</a>';
	};

	_ui.toSearchLinkEncounterSetName = function(card) {
		return '<a href="/' + ordb.static.language + '/card/search?eset=' + card.enstTechName + '">' + card.enstName
				+ '</a>';
	};

	_ui.toSearchLinkTraits = function(card) {
		var result = '';
		var traits = card.traits.split('. ');
		_.each(traits, function(trait, index) {
			trait = s.trim(trait.replace('.', ''));
			result += '<a href="/' + ordb.static.language + '/card/search?traits=' + trait + '">' + trait + '.</a>';
			if (index < traits.length - 1) {
				result += ' ';
			}
		});
		return result;
	};

	_ui.toSearchLinkTrait = function(name, techName) {
		if (_.isUndefined(techName)) {
			techName = name;
		}
		return '<a href="/' + ordb.static.language + '/card/search?traits=' + techName + '">' + name + '</a>';
	};

	_ui.toHtmlText = function(input) {
		if (_.isUndefined(input)) {
			return input;
		}

		var output = input;

		// icons
		var iconWordsRegExp = new RegExp('\\[(' + ordb.dict.iconWords.join('|') + ')\\]', 'g');
		output = output.replace(iconWordsRegExp, function(g0, g1) {
			return '<i class="db-icon db-icon-' + g1.toLowerCase() + '"></i>'
		});

		// traits
		var traitRegExp = /\[t(?: ([^\[\]]+))?\]([^\[]+)\[\/t\]/g;
		output = output.replace(traitRegExp, function(g0, g1, g2) {
			return '<i><strong>' + _ui.toSearchLinkTrait(g2, g1) + '</strong></i>';
		});
		
		// shadow
		var shadowRegExp = new RegExp('((?:Shadow|Schattern|Cień): )(\.+)', 'g');
		output = output.replace(shadowRegExp, '<i><strong>$1</strong>$2</i>');
		
		// trigger words
		var triggerWords = ordb.dict.triggerWords[ordb.static.language];
		if (ordb.static.language !== 'en') {
			triggerWords = triggerWords.concat(ordb.dict.triggerWords['en']);
		}
		var triggerWordsRegExp = new RegExp('(' + triggerWords.join('|') + ':)', 'g');
		output = output.replace(triggerWordsRegExp, '<strong>$1</strong>');

		// italics
		output = output.replace(/\[i\]([^\[]+)\[\/i\]/g, '<i>$1</i>')
		// bold
		output = output.replace(/\[b\]([^\[]+)\[\/b\]/g, '<strong>$1</strong>')
		// paragraphs
		var pStart = '<p class="card-text-block">';
		var pStartVictory = '<p class="card-text-block victory">';
		var pEnd = '</p>';
		output = pStart + output.replace(/\n/g, pEnd + pStart) + pEnd;

		// victory
		var victoryRegExp = new RegExp(pStart + '((?:Victory|Zwycięstwo|Sieg) [0-9]+\.)' + pEnd);
		output = output.replace(victoryRegExp, pStartVictory + '$1' + pEnd);

		return output;
	};

	_ui.toPlainText = function(input) {
		if (_.isUndefined(input)) {
			return input;
		}
		// trait
		output = input.replace(/\[t\]([A-Z0-9\-_]+)\[\/t\]/gi, '$1');
		// line breaks
		output = output.replace(/\n/g, ' ');
		// italics
		output = output.replace(/\[i\]([^\[]+)\[\/i\]/g, '$1')
		return output;
	};

	_ui.colors = {
		spheres: {
			leadership: {
				bg: '#A22FA0',
				fg: '#FFF'
			},
			tactics: {
				bg: '#C71313',
				fg: '#FFF'
			},
			spirit: {
				bg: '#4EBBF7',
				fg: '#000'
			},
			lore: {
				bg: '#108413',
				fg: '#000'
			},
			baggins: {
				bg: '#FBE821',
				fg: '#000'
			},
			fellowship: {
				bg: '#FD7E17',
				fg: '#000'
			},
			neutral: {
				bg: '#DDD'
			}
		},
		types: {
			ally: {
				bg: '#ED2626'
			},
			attachment: {
				bg: '#419441'
			},
			event: {
				bg: '#F0AD36'
			},
			treasure: {
				bg: '#3B84CC'
			}
		}
	};

	_ui.writeAttr = function(name, value) {
		return name + '="' + value + '"';
	};

	_ui.writeAttrs = function(attrs) {
		var result = '';
		if (!_.isUndefined(attrs)) {
			for ( var key in attrs) {
				result = result + ' ' + _ui.writeAttr(key, attrs[key]);
			}
		}
		return result.trim();
	};

	_ui.writeFactionImgElem = function(techName) {
		return '<img src="' + _ui.toFactionImageMd(techName) + '" />';
	};

	_ui.writeCardImgElem = function(imageBase, attrs) {
		return '<img ' + _ui.writeAttrs($.extend({
			src: _ui.toCardImage(imageBase)
		}, attrs)) + ' />';
	};

	_ui.parsePlainTextDeck = function(text, options) {

	};

	_ui.buildCardsTypeahead = function(filter, options) {
		//
		// create suggestion engine
		//

		options = options || {};

		var sourceCards = ordb.dict.getCards();
		if (options.playerDeckOnly) {
			sourceCards = ordb.dict.getPlayerDeckCards();
		}
		var cards = new Bloodhound({
			datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			local: $.map(sourceCards, function(card) {
				return {
					name: card.name,
					card: card
				};
			})
		});

		var traits = new Bloodhound({
			datumTokenizer: Bloodhound.tokenizers.obj.whitespace('description'),
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			local: ordb.dict.traits
		});

		var keywords = new Bloodhound({
			datumTokenizer: Bloodhound.tokenizers.obj.whitespace('description'),
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			local: ordb.dict.keywords
		});

		cards.initialize();
		traits.initialize();
		keywords.initialize();

		//
		// build typeahed object
		//
		var $typeahead = $(options.selector).typeahead(
				{
					hint: true,
					highlight: true,
					minLength: 1
				},
				{
					name: 'cards',
					displayKey: 'name',
					source: cards.ttAdapter(),
					templates: {
						suggestion: Handlebars.compile('{{name}}&nbsp;<span class="tt-no-highlight">'
								+ '{{card.setName}} | {{card.sphereDisplay}} '
								+ '| {{card.typeDisplay}} | {{card.traits}}</span>'),
						header: '<div class="tt-multi-header">' + ordb.dict.messages['core.card'] + '</div>'
					}
				}, {
					name: 'traits',
					displayKey: 'description',
					source: traits.ttAdapter(),
					templates: {
						header: '<div class="tt-multi-header">' + ordb.dict.messages['core.trait'] + '</div>'
					}
				}, {
					name: 'keywords',
					displayKey: 'description',
					source: keywords.ttAdapter(),
					templates: {
						header: '<div class="tt-multi-header">' + ordb.dict.messages['core.keyword'] + '</div>'
					}
				});

		//
		// put values from filter object into input
		//
		var $input = $(options.selector);
		if (filter.has('traits')) {
			$input.val(filter.get('traits'))
		} else if (filter.has('keywords')) {
			$input.val(filter.get('keywords'))
		} else if (filter.has('techName')) {
			var card = ordb.dict.findCard(filter.get('techName'));
			if (card) {
				$input.val(card.name);
			}
		} else if (filter.has('text')) {
			$input.val(filter.get('text'))
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
					if (!(filter.has('techName') || filter.has('traits') || filter.has('keywords') || filter
							.has('text'))) {
						obj['text'] = text;
					}
				} else {
					obj['techName'] = undefined;
					obj['traits'] = undefined;
					obj['keywords'] = undefined;
					obj['text'] = undefined;
				}

				filter.set(obj, {
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
				filter.trigger('change', filter);
			}
		});

		$('#textFilter .btn').click(function() {
			filter.trigger('change', filter);
		});

		return $typeahead;
	};

	_ui.adjustNavbarColors = function(faction) {
		// var selector = '.navbar, .navbar .navbar-brand, .navbar .navbar-nav
		// a';
		// var removeClasses = _.reduce(ordb.dict.factions,
		// function(outcome, faction) {
		// return outcome + 'bg-' + faction.techName + ' ';
		// }, '');
		// $(selector).removeClass(removeClasses);
		// if (faction) {
		// $(selector).addClass('bg-' + faction);
		// }
		// $('#wrapper').css('backgroundColor', '#f2f2f2');
	};

	_ui.adjustWrapperStyle = function(css) {
		css = css || {};
		if (css.backgroundColor) {
			$('#wrapper').css({
				backgroundColor: css.backgroundColor
			});
		} else {
			$('#wrapper').css({
				backgroundColor: ''
			});
		}
	};

})(ordb.ui);

//
// deck
//
ordb.deck = ordb.deck || {};
(function(_deck) {

	_deck.getDeckHelper = function(options) {
		var warlord;
		if (options.warlord) {
			warlord = options.warlord;
		} else {
			warlord = ordb.dict.findCard(options.warlordId);
		}

		var deckHelper;
		if (warlord.techName == 'commander-starblaze') {
			deckHelper = new _deck.CommanderStarblazeDeckHelper(warlord);
		} else if (warlord.techName == 'gorzod') {
			deckHelper = new _deck.GorzodDeckHelper(warlord);
		} else if (warlord.faction == 'tyranid') {
			deckHelper = new _deck.TyranidDeckHelper(warlord);
		} else if (warlord.faction == 'necron') {
			deckHelper = new _deck.NecronDeckHelper(warlord);
		} else {
			deckHelper = new _deck.RegularDeckHelper(warlord);
		}
		return deckHelper;
	}

	_deck.getPlayerDeckMembers = function() {
		var playerDeckCards = ordb.dict.getPlayerDeckCards();
		var playerDeckMembers = [];
		_.each(playerDeckCards, function(card) {
			var member = {
				cardId: card.id,
				quantity: 0,
				maxQuantity: _.isNumber(card.quantity) ? card.quantity : 3
			};
			playerDeckMembers.push(member);
		});
		return playerDeckMembers;
	};

	//
	// predicate for cards from regular decks (on alignment circle)
	//
	_deck.buildRegularDeckCardPredicate = function(warlord) {
		var alliedDeckFactions = _.pluck(_deck.getAlliedDeckFactions(warlord.id), 'techName');

		return function(card) {
			// invalid type
			if (!_deck.isValidDeckCardType(card.type)) {
				return false;
			}
			// invalid faction
			if (alliedDeckFactions.indexOf(card.faction) < 0) {
				return false;
			}
			// invalid warlord
			if (card.type == 'warlord') {
				return false;
			}
			// invalid signature squad
			if (card.warlordId && card.warlordId !== warlord.id) {
				return false;
			}
			// loyal to another faction
			if (card.loyal == true && card.faction !== warlord.faction) {
				return false;
			}
			return true;
		};
	};

	//
	// predicate for card from warlord's own faction
	//
	_deck.buildWarlordFactionCardPredicate = function(warlord) {
		return function(card) {
			// invalid type
			if (!_deck.isValidDeckCardType(card.type)) {
				return false;
			}
			// invalid faction
			if (warlord.faction != card.faction) {
				return false;
			}
			// invalid warlord
			if (card.type == 'warlord') {
				return false;
			}
			// invalid signature squad
			if (card.warlordId && card.warlordId !== warlord.id) {
				return false;
			}
			return true;
		};
	};

	//
	// predicate for common cards
	//
	_deck.buildCommonCardPredicate = function() {
		return function(card) {
			// valid type and not in signature squad and not loyal
			return _deck.isValidDeckCardType(card.type) && _.isUndefined(card.warlordId) && card.loyal === false;
		};
	};

	//
	// predicate for cards with given trait
	//
	_deck.buildTraitCardPredicate = function(trait) {
		return function(card) {
			// valid type and has given trait
			var outcome = _deck.isValidDeckCardType(card.type);
			if (outcome && card.traitEn) {
				outcome = _.indexOf(card.traitEn.trim().toLowerCase().split(/ *\. */), trait) >= 0;
			} else {
				outcome = false;
			}
			return outcome;
		};
	};

	_deck.buildRegularDeckFactionPredicate = function(warlord) {
		var circleFactions = _.filter(ordb.dict.factions, function(faction) {
			return faction.techName != 'neutral' && faction.techName != 'necron' && faction.techName != 'tyranid';
		});
		var faction = _.findWhere(ordb.dict.factions, {
			techName: warlord.faction
		});

		return function(faction) {
			var techName = faction.techName;
			if (techName == 'neutral') {
				return true;
			}
			if (techName == warlord.faction) {
				return true;
			}
			var index = _.findIndex(circleFactions, function(faction) {
				return faction.techName == warlord.faction;
			});
			var length = circleFactions.length;
			if (circleFactions[(index - 1 + length) % length].techName == techName
					|| circleFactions[(index + 1) % length].techName == techName) {
				return true;
			}
			return false;
		};
	};

	_deck.RegularDeckHelper = function(warlord) {
		this.getAlliedDeckFactions = function() {
			return _.filter(ordb.dict.factions, _deck.buildRegularDeckFactionPredicate(warlord));
		};

		this.getValidDeckFactions = function() {
			return this.getAlliedDeckFactions();
		};

		this.filterValidDeckCards = function(cards) {
			return _.filter(cards, _deck.buildRegularDeckCardPredicate(warlord));
		};
	};

	_deck.TyranidDeckHelper = function(warlord) {
		this.getAlliedDeckFactions = function() {
			return undefined;
		};

		this.getValidDeckFactions = function() {
			return _.filter(ordb.dict.factions, function(faction) {
				return faction.techName == 'tyranid' || faction.techName == 'neutral';
			});
		};

		this.filterValidDeckCards = function(cards) {
			var warlordFaction = _deck.buildWarlordFactionCardPredicate(warlord);
			var neutralNonArmy = function(card) {
				return card.faction == 'neutral' && card.type != 'army';
			};
			return _.filter(cards, function(card) {
				return warlordFaction(card) || neutralNonArmy(card);
			});
		};
	};

	_deck.NecronDeckHelper = function(warlord) {
		this.getAlliedDeckFactions = function() {
			return undefined;
		};

		this.getValidDeckFactions = function() {
			return _.filter(ordb.dict.factions, function(faction) {
				return faction.techName != 'tyranid';
			});
		};

		this.filterValidDeckCards = function(cards) {
			var warlordFaction = _deck.buildWarlordFactionCardPredicate(warlord);
			var common = _deck.buildCommonCardPredicate(warlord);
			var nonTyranidArmy = function(card) {
				return card.faction != 'tyranid' && card.type == 'army';
			};
			var neutral = function(card) {
				return card.faction == 'neutral';
			}
			return _.filter(cards, function(card) {
				return warlordFaction(card) || neutral(card) || nonTyranidArmy(card) && common(card);
			});
		};
	};

	_deck.CommanderStarblazeDeckHelper = function(warlord) {
		this.getAlliedDeckFactions = function() {
			return _.filter(ordb.dict.factions, _deck.buildRegularDeckFactionPredicate(warlord));
		};

		this.getValidDeckFactions = function() {
			var filtered = this.getAlliedDeckFactions();
			filtered.push(_.findWhere(ordb.dict.factions, {
				techName: 'astra-militarum'
			}));
			return filtered;
		};

		this.filterValidDeckCards = function(cards) {
			var standard = _deck.buildRegularDeckCardPredicate(warlord);
			var common = _deck.buildCommonCardPredicate();
			return _.filter(cards, function(card) {
				return standard(card) || (common(card) && card.faction == 'astra-militarum');
			});
		};

	};

	_deck.GorzodDeckHelper = function(warlord) {
		this.getAlliedDeckFactions = function() {
			return _.filter(ordb.dict.factions, _deck.buildRegularDeckFactionPredicate(warlord));
		};

		this.getValidDeckFactions = function() {
			var filtered = this.getAlliedDeckFactions();
			filtered.push(_.findWhere(ordb.dict.factions, {
				techName: 'space-marines'
			}));
			return filtered;
		};

		this.filterValidDeckCards = function(cards) {
			var standard = _deck.buildRegularDeckCardPredicate(warlord);
			var common = _deck.buildCommonCardPredicate();
			var vehicle = _deck.buildTraitCardPredicate("vehicle");
			return _.filter(cards, function(card) {
				return standard(card) || (common(card) && vehicle(card) && card.faction == 'space-marines');
			});
		};
	};

	/**
	 * @memberOf _deck
	 */
	_deck.dummy = function() {
	};

})(ordb.deck);

//
// ???
//
(function(_ordb) {

})(ordb);
