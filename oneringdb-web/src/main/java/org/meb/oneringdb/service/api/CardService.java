package org.meb.oneringdb.service.api;

import java.util.List;

import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.db.query.CardQuery;

public interface CardService extends SearchService {

	List<Card> findCards(CardQuery query);

}
