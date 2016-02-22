package org.meb.oneringdb.web.rest.controller;

import java.util.PropertyResourceBundle;

import javax.inject.Inject;
import javax.persistence.EntityManager;

import org.meb.oneringdb.core.exception.DeckException;
import org.meb.oneringdb.service.RequestContext;
import org.meb.oneringdb.web.auth.AuthToken;
import org.meb.oneringdb.web.json.model.JsonError;
import org.meb.oneringdb.web.rest.MessageBundleResolver;

public class AbstractController {

	@Inject
	protected RequestContext requestContext;
	@Inject
	protected AuthToken authToken;
	@Inject
	private MessageBundleResolver resolver;
	@Inject
	protected EntityManager em;

	protected DeckException buildDeckException(Exception e, String error) {
		DeckException de;
		if (e instanceof DeckException) {
			de = (DeckException) e;
			de.bindErrorContext(error);
		} else {
			de = new DeckException(e);
			de.setErrorCore(error);
			de.setRequestContext(requestContext);
		}
		return de;
	}

	protected JsonError buildJsonError(DeckException de) {
		PropertyResourceBundle bundle = resolver.getClientBundle(requestContext.getUserLanguage());
		return new JsonError(de.getTimestamp(), de.toUserMessage(bundle));
	}
}
