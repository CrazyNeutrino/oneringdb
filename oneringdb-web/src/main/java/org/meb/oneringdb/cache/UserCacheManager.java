package org.meb.oneringdb.cache;

import java.io.Serializable;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.persistence.EntityManager;

import org.meb.oneringdb.db.dao.JpaDao;
import org.meb.oneringdb.db.model.User;
import org.meb.oneringdb.db.query.UserQuery;
import org.meb.oneringdb.db.util.DatabaseUtils;
import org.meb.oneringdb.service.RequestContext;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;

public class UserCacheManager {

	@Inject
	private EntityManager em;

	@Inject
	private RequestContext requestContext;

	private JpaDao<User, UserQuery> userDao;

	@PostConstruct
	private void initialize() {
		userDao = new JpaDao<>(em);
	}

	private Cache getCache() {
		Cache cache = CacheManager.getInstance().getCache(getCacheName());

		Element element = cache.get(getUsersKey());
		if (element == null) {
			synchronized (UserCacheManager.class) {
				element = cache.get(getUsersKey());
				if (element == null) {
					DatabaseUtils.executeSetUserLang(em, requestContext.getUserLanguage());
					List<User> users = userDao.find(new UserQuery());
					cache.put(new Element(getUsersKey(), users));
					for (User user : users) {
						cache.put(new Element(user.getId(), user));
					}
				}
			}
		}

		return cache;
	}

	private String getCacheName() {
		return "cache.user";
	}

	private Serializable getUsersKey() {
		return "user.all";
	}

	public User getUser(Long userId) {
		User user;

		Cache cache = getCache();
		Element element = cache.get(userId);
		if (element == null) {
			user = userDao.findUnique(new User(userId));
			if (user != null) {
				cache.put(new Element(userId, user));
			}
		} else {
			user = (User) element.getObjectValue();
		}

		return user;
	}
}
