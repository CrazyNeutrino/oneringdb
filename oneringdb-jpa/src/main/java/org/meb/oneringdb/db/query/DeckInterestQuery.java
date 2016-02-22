package org.meb.oneringdb.db.query;

import org.meb.oneringdb.db.model.DeckInterest;

public class DeckInterestQuery extends Query<DeckInterest> {

	public DeckInterestQuery() {
		super(new DeckInterest());
	}
	
	public DeckInterestQuery(DeckInterest example) {
		super(example);
	}
}
