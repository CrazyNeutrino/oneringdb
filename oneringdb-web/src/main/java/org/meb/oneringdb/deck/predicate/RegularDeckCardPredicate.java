package org.meb.oneringdb.deck.predicate;

import java.util.HashSet;
import java.util.Set;

import org.apache.commons.collections4.Predicate;
import org.meb.oneringdb.db.model.CardType;
import org.meb.oneringdb.db.model.loc.Card;

public class RegularDeckCardPredicate implements Predicate<Card> {

	protected final Set<CardType> DECK_CARD_TYPES;

	public RegularDeckCardPredicate() {
		this.DECK_CARD_TYPES = new HashSet<>();
		this.DECK_CARD_TYPES.add(CardType.HERO);
		this.DECK_CARD_TYPES.add(CardType.ALLY);
		this.DECK_CARD_TYPES.add(CardType.ATTACHMENT);
		this.DECK_CARD_TYPES.add(CardType.EVENT);
	}

	@Override
	public boolean evaluate(Card card) {
		return DECK_CARD_TYPES.contains(card.getType());
	}
}
