package org.meb.oneringdb.deck.validation;

import org.meb.oneringdb.core.exception.DeckException;
import org.meb.oneringdb.core.exception.DeckExceptionBuilder;
import org.meb.oneringdb.db.model.Deck;

public interface DeckValidator {

	public enum ValidationMode {
		STRICT
	};

	void validate(Deck deck) throws DeckException;

	ValidationMode getValidationMode();
	
	void setValidationMode(ValidationMode validationMode);
	
	DeckExceptionBuilder getDeckExceptionBuilder();
	
	void setDeckExceptionBuilder(DeckExceptionBuilder deckExceptionBuilder);
}
