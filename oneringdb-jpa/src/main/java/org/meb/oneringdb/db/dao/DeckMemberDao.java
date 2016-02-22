package org.meb.oneringdb.db.dao;

import javax.persistence.EntityManager;

import org.meb.oneringdb.db.model.DeckMember;
import org.meb.oneringdb.db.query.DeckMemberQuery;

public class DeckMemberDao extends JpaDaoAbstract<DeckMember, DeckMemberQuery> {

	public DeckMemberDao(EntityManager em) {
		super(em);
	}

	@Override
	protected DeckMemberQuery createQuery(DeckMember example) {
		return new DeckMemberQuery(example);
	}
}
