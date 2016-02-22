package org.meb.oneringdb.deck.helper;

import java.util.List;

import org.apache.commons.collections4.Predicate;
import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.deck.validation.DeckValidator;

public interface DeckHelper {

	List<Card> filterAllowedCards(List<Card> cards);
	
	Predicate<Card> buildAllowedCardPredicate();
	
	DeckValidator buildDeckValidator();
}
