package org.meb.oneringdb.util;

import org.meb.oneringdb.db.model.User;

public interface UserResolver {

	User resolve(Long id);
}
