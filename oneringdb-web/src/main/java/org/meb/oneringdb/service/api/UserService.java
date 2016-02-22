package org.meb.oneringdb.service.api;

import java.util.List;

import org.meb.oneringdb.core.exception.DeckException;
import org.meb.oneringdb.db.model.User;
import org.meb.oneringdb.db.model.UserContribSummary;

public interface UserService extends SearchService {

	User signInUser(String name, String password) throws DeckException;

	User signUpUser(String name, String email, String password) throws DeckException;
	
	User activateUser(String activationCode);
	
	User prepareResetPassword(String email) throws DeckException;
	
	User resetPassword(String code, String password);
	
	List<UserContribSummary> findContributors();
}
