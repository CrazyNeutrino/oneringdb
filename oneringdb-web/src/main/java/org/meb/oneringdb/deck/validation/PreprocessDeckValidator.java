package org.meb.oneringdb.deck.validation;

import static org.meb.oneringdb.db.util.Functions.CardId;
import static org.meb.oneringdb.db.util.Functions.DeckMemberCard;
import static org.meb.oneringdb.db.util.Functions.DeckMemberCardId;

import java.util.Collection;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.meb.oneringdb.core.exception.DeckException;
import org.meb.oneringdb.core.exception.DeckExceptionBuilder;
import org.meb.oneringdb.db.model.Deck;
import org.meb.oneringdb.db.model.DeckMember;
import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.util.CardResolver;
import org.meb.oneringdb.util.UserResolver;

import com.google.common.collect.Collections2;
import com.google.common.collect.Maps;

import lombok.Getter;
import lombok.Setter;

public class PreprocessDeckValidator implements DeckValidator {

	@Getter
	@Setter
	private ValidationMode validationMode;

	@Getter
	@Setter
	private DeckExceptionBuilder deckExceptionBuilder;

	@Getter
	@Setter
	private CardResolver cardResolver;

	@Getter
	@Setter
	private UserResolver userResolver;

	@Override
	public void validate(Deck deck) throws DeckException {

		Set<DeckMember> members = deck.getDeckMembers();

		/*
		 * remove members with null or zero quantity
		 */
		Iterator<DeckMember> memberIter = members.iterator();
		while (memberIter.hasNext()) {
			DeckMember member = memberIter.next();
			Integer quantity = member.getQuantity();
			if (quantity == null || quantity.equals(0)) {
				memberIter.remove();
			}
		}

		/*
		 * check if cards are set resolve them against card resolver check if
		 * they are real cards
		 */
		Collection<Card> cards = resolve(Collections2.transform(members, DeckMemberCardId));
		if (cards == null) {
			cards = Collections2.transform(members, DeckMemberCard);
		}
		Map<Long, Card> cardsMap = Maps.uniqueIndex(cards, CardId);

		for (DeckMember member : members) {
			Card card = member.getCard();
			if (card == null || card.getId() == null) {
				throw buildDeckException(deck, "error.deck.card.notSet");
			} else {
				card = cardsMap.get(card.getId());
				if (card == null) {
					throw buildDeckException(deck, "error.deck.card.notFound");
				} else {
					member.setCard(card);
				}
			}
		}
	}

	private Card resolve(Long cardId) {
		if (cardResolver == null) {
			return null;
		} else {
			return cardResolver.resolve(cardId);
		}
	}

	private Collection<Card> resolve(Collection<Long> cardIds) {
		if (cardResolver == null) {
			return null;
		} else {
			return cardResolver.resolve(cardIds);
		}
	}

	protected DeckException buildDeckException(Deck deck, String error) {
		return deckExceptionBuilder.build(deck, error);
	}
}
