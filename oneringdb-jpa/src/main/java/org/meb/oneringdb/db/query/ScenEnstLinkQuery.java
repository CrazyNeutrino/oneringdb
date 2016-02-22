package org.meb.oneringdb.db.query;

import org.meb.oneringdb.db.model.ScenEnstLink;

public class ScenEnstLinkQuery extends Query<ScenEnstLink> {

	public ScenEnstLinkQuery() {
		this(new ScenEnstLink());
	}

	public ScenEnstLinkQuery(ScenEnstLink example) {
		super(example);
	}
}
