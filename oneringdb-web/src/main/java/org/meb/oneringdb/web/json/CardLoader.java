package org.meb.oneringdb.web.json;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import org.meb.oneringdb.db.model.loc.Card;
import org.meb.oneringdb.db.query.CardQuery;
import org.meb.oneringdb.service.api.CardService;
import org.meb.oneringdb.web.auth.AuthToken;
import org.meb.oneringdb.web.json.model.JsonCard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CardLoader implements Serializable {

	private static final long serialVersionUID = -5354259088056803341L;
	private static final Logger log = LoggerFactory.getLogger(CardLoader.class);

	@Inject
	private CardService cardService;
	
	@Inject
	private AuthToken authUser;

	public List<JsonCard> loadCards() {
		log.info("loadCards(): auth user: {}", authUser);

		CardQuery cardQuery = new CardQuery();
		cardQuery.getSorting().setSortingAsc("name");
		List<Card> cards = cardService.findCards(cardQuery);
		List<JsonCard> jsonCards = new ArrayList<>();
		for (Card card : cards) {
			jsonCards.add(new JsonCard(card));
		}
		return jsonCards;
	}
}
