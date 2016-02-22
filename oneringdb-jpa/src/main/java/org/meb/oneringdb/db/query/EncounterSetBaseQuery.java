package org.meb.oneringdb.db.query;

import org.meb.oneringdb.db.model.EncounterSetBase;

public class EncounterSetBaseQuery extends Query<EncounterSetBase> {

	public EncounterSetBaseQuery() {
		this(new EncounterSetBase());
	}
	
	public EncounterSetBaseQuery(EncounterSetBase example) {
		super(example);
	}
}
