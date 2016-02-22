package org.meb.oneringdb.service;

import java.util.List;
import java.util.Set;

import org.meb.oneringdb.db.model.loc.Card;

public interface CardProvider {

	Card provide(Long id);
	
	List<Card> provide(Set<Long> ids);
}
