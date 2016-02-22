package org.meb.oneringdb.db.query;

import org.meb.oneringdb.db.model.ScenarioBase;

public class ScenarioBaseQuery extends Query<ScenarioBase> {

	public ScenarioBaseQuery() {
		this(new ScenarioBase());
	}

	public ScenarioBaseQuery(ScenarioBase example) {
		super(example);
	}
}
