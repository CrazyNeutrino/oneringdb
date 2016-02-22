package org.meb.oneringdb.db.dao;

import javax.persistence.EntityManager;

import org.meb.oneringdb.db.model.EncounterSetBase;
import org.meb.oneringdb.db.query.EncounterSetBaseQuery;

public class EncounterSetBaseDao extends JpaDaoAbstract<EncounterSetBase, EncounterSetBaseQuery> {

	public EncounterSetBaseDao(EntityManager em) {
		super(em);
	}

	@Override
	protected EncounterSetBaseQuery createQuery(EncounterSetBase example) {
		return new EncounterSetBaseQuery(example);
	}
}
