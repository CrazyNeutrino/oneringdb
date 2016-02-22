package org.meb.oneringdb.deck.validation;

import org.apache.commons.collections4.Predicate;
import org.meb.oneringdb.core.exception.DeckException;
import org.meb.oneringdb.db.model.Deck;
import org.meb.oneringdb.db.model.loc.Card;

import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class RegularDeckValidator extends DeckValidatorBase {

	@NonNull
	@Getter
	private Predicate<Card> allowedCardPredicate;

	@Override
	protected void validateComposition(Deck deck) throws DeckException {
		// Set<Faction> factions = new HashSet<>();
		// for (DeckMember member : deck.getDeckMembers()) {
		// factions.add(member.getCard().getFaction());
		// }
		//
		// factions.remove(faction);
		// factions.remove(Faction.NEUTRAL);
		// if (factions.size() > 1) {
		// DeckException de = buildDeckException(deck,
		// "error.deck.comp.tooManyAlliedFactions");
		// de.setErrorCoreParameter(1, String.valueOf(factions));
		// throw de;
		// }
	}
}
