package org.meb.oneringdb.service.api;

import java.util.List;

import org.meb.oneringdb.db.query.Query;

public interface SearchService {

	<T> T findUnique(T example);

	<T> List<T> find(T example);

	<T> T findUnique(Query<T> query);

	<T> List<T> find(Query<T> query);

}
