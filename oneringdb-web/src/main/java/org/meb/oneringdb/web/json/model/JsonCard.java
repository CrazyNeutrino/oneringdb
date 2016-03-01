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
	private String traits;
	private String traitsEn;
	private String keywords;
	private Integer number;
	private Integer quantity;

	private Integer threatCost;
	private Integer resourceCost;
	private Integer engagementCost;
	private Integer willpower;
	private Integer threat;
	private Integer attack;
	private Integer defense;
	private Integer hitPoints;
	private Integer questPoints;
	private Integer victoryPoints;
	
	private Boolean unique;
	private Long crstId;
	private Long enstId;
	private String illustrator;

	public JsonCard(Card card) {
		id = card.getId();
		techName = card.getTechName();
		name = card.getName();
		nameEn = card.getNameEn();
		text = card.getText();
		imageBase = Utils.toImageBase(card, true);
		sphere = new SphereConverter().convertToDatabaseColumn(card.getSphere());
		sphereDisplay = card.getSphereDisplay();
		type = new CardTypeConverter().convertToDatabaseColumn(card.getType());
		typeDisplay = card.getTypeDisplay();
		traits = card.getTraits();
		traitsEn = card.getTraitsEn();
		keywords = card.getKeywords();
		number = card.getNumber();
		quantity = card.getQuantity();
		threatCost = card.getThreatCost();
		resourceCost = card.getResourceCost();
		engagementCost = card.getEngagementCost();
		willpower = card.getWillpower();
		threat = card.getThreat();
		attack = card.getAttack();
		defense = card.getDefense();
		hitPoints = card.getHitPoints();
		questPoints = card.getQuestPoints();
		victoryPoints = card.getVictoryPoints();
		unique = card.getUnique();
		crstId = card.getCrstId();
		enstId = card.getEnstId();
		illustrator = card.getIllustrator();
	}
}