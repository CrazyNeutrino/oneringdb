package org.meb.oneringdb.deck.helper;

import org.apache.commons.collections4.Predicate;
import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.deck.predicate.RegularDeckCardPredicate;
import org.meb.oneringdb.deck.validation.DeckValidator;
import org.meb.oneringdb.deck.validation.RegularDeckValidator;

public class RegularDeckHelper extends DeckHelperBase {

	@Override
	public Predicate<Card> buildAllowedCardPredicate() {
		return new RegularDeckCardPredicate();
	}

	@Override
	public DeckValidator buildDeckValidator() {
		return new RegularDeckValidator(buildAllowedCardPredicate());
	}
}
