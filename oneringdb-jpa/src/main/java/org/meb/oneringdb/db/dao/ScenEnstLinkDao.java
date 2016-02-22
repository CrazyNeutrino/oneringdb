package org.meb.oneringdb.db.dao;

import javax.persistence.EntityManager;

import org.meb.oneringdb.db.model.ScenEnstLink;
import org.meb.oneringdb.db.query.ScenEnstLinkQuery;

public class ScenEnstLinkDao extends JpaDaoAbstract<ScenEnstLink, ScenEnstLinkQuery> {

	public ScenEnstLinkDao(EntityManager em) {
		super(em);
	}

	@Override
	protected ScenEnstLinkQuery createQuery(ScenEnstLink example) {
		return new ScenEnstLinkQuery(example);
	}
}
