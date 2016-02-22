package org.meb.oneringdb.util;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.persistence.EntityManager;

import org.meb.oneringdb.db.dao.JpaDao;
import org.meb.oneringdb.db.model.User;
import org.meb.oneringdb.db.query.UserQuery;

public class DatabaseUserResolver implements UserResolver {

	@Inject
	private EntityManager em;

	private JpaDao<User, UserQuery> userDao;

	@PostConstruct
	private void initialize() {
		userDao = new JpaDao<>(em);
	}

	@Override
	public User resolve(Long userId) {
		return userDao.findUnique(new User(userId));
	}
}
