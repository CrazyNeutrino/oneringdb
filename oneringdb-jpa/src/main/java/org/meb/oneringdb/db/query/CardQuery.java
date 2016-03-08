package org.meb.oneringdb.db.query;

import java.util.Set;

import org.meb.oneringdb.db.model.CardType;
import org.meb.oneringdb.db.model.loc.Card;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CardQuery extends Query<Card> {

	private String text;
	private boolean searchInName = true;
	private boolean searchInTrait = true;
	private boolean searchInText = true;

	@CriteriaIn("id")
	private Set<Long> ids;

	@CriteriaIn("type")
	private Set<CardType> types;

	@CriteriaIn("crstId")
	private Set<Long> crstIds;

	@CriteriaIn("crstTechName")
	private Set<String> crstTechNames;

	public CardQuery() {
		super(new Card());
	}

	public CardQuery(Card example) {
		super(example);
	}

	public CardQuery(Set<Long> ids) {
		super(new Card());
		this.ids = ids;
	}
}
