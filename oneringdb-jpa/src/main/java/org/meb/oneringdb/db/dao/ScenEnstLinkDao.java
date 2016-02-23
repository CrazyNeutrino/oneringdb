package org.meb.oneringdb.db.dao;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;
import org.meb.oneringdb.db.model.EncounterSetBase;
import org.meb.oneringdb.db.model.EncounterSetBase_;
import org.meb.oneringdb.db.model.ScenEnstLink;
import org.meb.oneringdb.db.model.ScenEnstLink_;
import org.meb.oneringdb.db.model.ScenarioBase;
import org.meb.oneringdb.db.model.ScenarioBase_;
import org.meb.oneringdb.db.query.ScenEnstLinkQuery;

public class ScenEnstLinkDao extends JpaDaoAbstract<ScenEnstLink, ScenEnstLinkQuery> {

	public ScenEnstLinkDao(EntityManager em) {
		super(em);
	}

	@Override
	protected ScenEnstLinkQuery createQuery(ScenEnstLink example) {
		return new ScenEnstLinkQuery(example);
	}

	@Override
	protected List<Predicate> buildCustomCriteria(ScenEnstLinkQuery query, Root<ScenEnstLink> root) {
		List<Predicate> predicates = super.buildCustomCriteria(query, root);

		EntityManager em = getEntityManager();
		CriteriaBuilder cb = em.getCriteriaBuilder();

		EncounterSetBase esb = query.getExample().getEncounterSetBase();
		if (esb != null) {
			Path<EncounterSetBase> path = root.get(ScenEnstLink_.encounterSetBase);
			String techName = StringUtils.trimToNull(esb.getTechName());
			if (techName != null) {
				predicates.add(cb.equal(path.get(EncounterSetBase_.techName), techName));
			}
		}

		ScenarioBase sb = query.getExample().getScenarioBase();
		if (sb != null) {
			Path<ScenarioBase> path = root.get(ScenEnstLink_.scenarioBase);
			String techName = StringUtils.trimToNull(sb.getTechName());
			if (techName != null) {
				predicates.add(cb.equal(path.get(ScenarioBase_.techName), techName));
			}
		}

		return predicates;
	}
}
