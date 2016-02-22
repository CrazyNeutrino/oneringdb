package org.meb.oneringdb.util;

import java.util.Collection;

import org.meb.oneringdb.db.model.loc.Card;

public interface CardResolver {

	Card resolve(Long cardId);
	
	Collection<Card> resolve(Collection<Long> cardIds);
}
