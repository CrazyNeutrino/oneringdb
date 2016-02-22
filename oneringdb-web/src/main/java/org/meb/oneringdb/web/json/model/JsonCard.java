package org.meb.oneringdb.web.json.model;

import org.meb.oneringdb.db.converter.CardTypeConverter;
import org.meb.oneringdb.db.converter.SphereConverter;
import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.db.util.Utils;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class JsonCard {

	private Long id;
	private String techName;
	private String name;
	private String nameEn;
	private String text;
	private String imageBase;
	private String sphere;
	private String sphereDisplay;
	private String type;
	private String typeDisplay;
	private String trait;
	private String traitEn;
	private String keyword;
	private Integer number;
	private Integer quantity;

	private Integer cost;
	private Integer willpower;
	private Integer attack;
	private Integer defense;
	private Integer hitPoints;
	private Integer threat;
	private Integer startingThreat;
	private Integer engageThreat;
	private Integer questPoints;
	private Integer victoryPoints;

	private Boolean unique;
	private Long setId;
	private String illustrator;

	public JsonCard(Card card) {
		id = card.getId();
		techName = card.getTechName();
		name = card.getName();
		nameEn = card.getNameEn();
		text = card.getText();
		imageBase = Utils.imageBase(card, true);
		sphere = new SphereConverter().convertToDatabaseColumn(card.getSphere());
		sphereDisplay = card.getSphereDisplay();
		type = new CardTypeConverter().convertToDatabaseColumn(card.getType());
		typeDisplay = card.getTypeDisplay();
		trait = card.getTrait();
		traitEn = card.getTraitEn();
		keyword = card.getKeyword();
		number = card.getNumber();
		quantity = card.getQuantity();
		cost = card.getCost();
		willpower = card.getWillpower();
		attack = card.getAttack();
		defense = card.getDefense();
		hitPoints = card.getHitPoints();
		threat = card.getThreat();
		startingThreat = card.getStartingThreat();
		engageThreat = card.getEngageThreat();
		questPoints = card.getQuestPoints();
		victoryPoints = card.getVictoryPoints();
		unique = card.getUnique();
		setId = card.getCrstId();
		illustrator = card.getIllustrator();
	}
}