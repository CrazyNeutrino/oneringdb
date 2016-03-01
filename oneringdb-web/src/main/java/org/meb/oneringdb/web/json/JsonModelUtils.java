package org.meb.oneringdb.web.json;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.codehaus.jackson.JsonProcessingException;
import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.db.model.loc.CardSet;
import org.meb.oneringdb.db.model.loc.EncounterSet;
import org.meb.oneringdb.web.json.model.JsonCard;
import org.meb.oneringdb.web.json.model.JsonCardSet;
import org.meb.oneringdb.web.json.model.JsonEncounterSet;

public class JsonModelUtils {

	public static String cardsAsJson(List<Card> cards) throws JsonProcessingException, IOException {
		List<JsonCard> jsonCards = new ArrayList<>();
		for (Card card: cards) {
			jsonCards.add(new JsonCard(card));
		}
		return JsonUtils.write(jsonCards);
	}
	
	public static String cardSetsAsJson(List<CardSet> cardSets) throws JsonProcessingException, IOException {
		List<JsonCardSet> jsonCardSets = new ArrayList<>();
		for (CardSet cardSet: cardSets) {
			jsonCardSets.add(new JsonCardSet(cardSet));
		}
		return JsonUtils.write(jsonCardSets);
	}
	
	public static String encounterSetsAsJson(List<EncounterSet> encounterSets) throws JsonProcessingException, IOException {
		List<JsonEncounterSet> jsonEncounterSets = new ArrayList<>();
		for (EncounterSet encounterSet: encounterSets) {
			jsonEncounterSets.add(new JsonEncounterSet(encounterSet));
		}
		return JsonUtils.write(jsonEncounterSets);
	}
}
