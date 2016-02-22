package org.meb.oneringdb.db.dao;

import javax.persistence.EntityManager;

import org.meb.oneringdb.db.model.ScenarioBase;
import org.meb.oneringdb.db.query.ScenarioBaseQuery;

public class ScenarioBaseDao extends JpaDaoAbstract<ScenarioBase, ScenarioBaseQuery> {

	public ScenarioBaseDao(EntityManager em) {
		super(em);
	}

	@Override
	protected ScenarioBaseQuery createQuery(ScenarioBase example) {
		return new ScenarioBaseQuery(example);
	}
}
