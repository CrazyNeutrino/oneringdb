package org.meb.oneringdb.web.json;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import org.meb.oneringdb.db.model.loc.CardSet;
import org.meb.oneringdb.db.query.Query;
import org.meb.oneringdb.service.api.CardSetService;
import org.meb.oneringdb.web.auth.AuthToken;
import org.meb.oneringdb.web.json.model.JsonCardSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CardSetLoader implements Serializable {

	private static final long serialVersionUID = -5379874965998261933L;
	private static final Logger log = LoggerFactory.getLogger(CardSetLoader.class);

	@Inject
	private CardSetService cardSetService;

	@Inject
	private AuthToken authUser;

	public List<JsonCardSet> loadCardSets() {
		log.info("loadCardSets(): auth user: {}", authUser);

		Query<CardSet> cardSetQuery = new Query<>(new CardSet());
		cardSetQuery.getSorting().setSortingAsc("releaseDate");
		cardSetQuery.getSorting().setSortingAsc("id");
		List<CardSet> cardSets = cardSetService.find(cardSetQuery);
		List<JsonCardSet> jsonCardSets = new ArrayList<>();
		for (CardSet cardSet : cardSets) {
			jsonCardSets.add(new JsonCardSet(cardSet));
		}
		return jsonCardSets;
	}
}
