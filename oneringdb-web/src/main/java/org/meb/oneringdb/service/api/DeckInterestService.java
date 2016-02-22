package org.meb.oneringdb.service.api;

import org.meb.oneringdb.core.exception.DeckException;
import org.meb.oneringdb.service.DeckInterestWrapper;

public interface DeckInterestService extends SearchService {

	DeckInterestWrapper markFavourite(Long deckId, Integer value) throws DeckException;

	DeckInterestWrapper markSuperb(Long deckId, Integer value) throws DeckException;

	DeckInterestWrapper loadUserDeckInterests(Long deckId);
	
	void deleteDeckInterests(Long deckId) throws DeckException;

	void flushDeckInterests();
}
