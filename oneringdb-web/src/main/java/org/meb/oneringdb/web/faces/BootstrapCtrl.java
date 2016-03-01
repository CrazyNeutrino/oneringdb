package org.meb.oneringdb.web.faces;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.StringUtils;
import org.codehaus.jackson.JsonProcessingException;
import org.meb.oneringdb.core.Cache;
import org.meb.oneringdb.db.model.UserContribSummary;
import org.meb.oneringdb.db.model.loc.Domain;
import org.meb.oneringdb.db.util.Functions;
import org.meb.oneringdb.service.RequestContext;
import org.meb.oneringdb.service.api.UserService;
import org.meb.oneringdb.web.auth.AuthToken;
import org.meb.oneringdb.web.json.JsonModelUtils;
import org.meb.oneringdb.web.json.JsonUtils;
import org.meb.oneringdb.web.json.model.JsonDomain;
import org.meb.oneringdb.web.json.model.JsonDomainExt;

import com.google.common.collect.Maps;

@Named
@RequestScoped
public class BootstrapCtrl {

	@Inject
	private AuthToken authToken;

	@Inject
	private RequestContext queryContext;

	@Inject
	private LocaleCtrl localeCtrl;

	@Inject
	private UserService userService;

	@Inject
	private Cache cache;

	public String getCardsData() throws JsonProcessingException, IOException {
		queryContext.setUserId(authToken.getUserId());
		queryContext.setUserLanguage(localeCtrl.getLanguage());
		return JsonModelUtils.cardsAsJson(cache.loadCards());
	}

	public String getCardSetsData() throws JsonProcessingException, IOException {
		queryContext.setUserId(authToken.getUserId());
		queryContext.setUserLanguage(localeCtrl.getLanguage());
		return JsonModelUtils.cardSetsAsJson(cache.loadCardSets());
	}
	
	public String getEncounterSetsData() throws JsonProcessingException, IOException {
		queryContext.setUserId(authToken.getUserId());
		queryContext.setUserLanguage(localeCtrl.getLanguage());
		return JsonModelUtils.encounterSetsAsJson(cache.loadEncounterSets());
	}

	public String getDomainSpheresData() throws JsonProcessingException, IOException {
		List<Domain> sphereList = getDomainDataRaw("sphere");
		List<Domain> sphereShortList = getDomainDataRaw("sphere-short");
		Map<String, Domain> sphereShortIndex = Maps.uniqueIndex(sphereShortList,
				Functions.DomainValue);

		List<JsonDomainExt> spheresData = new ArrayList<>();
		for (Domain sphere : sphereList) {
			String techName = sphere.getValue();
			String name = sphere.getDescription();
			String shortName = null;
			if (sphereShortIndex.containsKey(techName)) {
				shortName = sphereShortIndex.get(techName).getDescription();
			}
			spheresData.add(new JsonDomainExt(techName, name, shortName));
		}
		return JsonUtils.write(spheresData);
	}

	public String getDomainCardTypesData() throws JsonProcessingException, IOException {
		List<Domain> cardTypeList = getDomainDataRaw("card-type");

		List<JsonDomainExt> cardTypeData = new ArrayList<>();
		for (Domain cardType : cardTypeList) {
			String techName = cardType.getValue();
			String name = cardType.getDescription();
			String nameEn = cardType.getDescriptionEn();
			String shortName = name.substring(0, 3);
			cardTypeData.add(new JsonDomainExt(techName, name, nameEn, shortName));
		}
		return JsonUtils.write(cardTypeData);
	}


	public String getDomainTraitsData() throws JsonProcessingException, IOException {
		return getDomainData("trait");
	}

	public String getDomainKeywordsData() throws JsonProcessingException, IOException {
		return getDomainData("keyword");
	}

	private String getDomainData(String name) throws JsonProcessingException, IOException {
		return getDomainData(name, null);
	}

	private List<Domain> getDomainDataRaw(String name) {
		queryContext.setUserId(authToken.getUserId());
		queryContext.setUserLanguage(localeCtrl.getLanguage());
		return cache.loadDomains(name);
	}

	private String getDomainData(String name, Processor<Domain, JsonDomain> processor)
			throws JsonProcessingException, IOException {

		List<JsonDomain> jsonDomains = new ArrayList<>();
		List<Domain> domains = getDomainDataRaw(name);
		for (Domain domain : domains) {
			JsonDomain jsonDomain;
			if (processor == null) {
				jsonDomain = new JsonDomain();
				jsonDomain.setValue(domain.getValue());
				jsonDomain.setDescription(domain.getDescription());
			} else {
				jsonDomain = processor.process(domain);
			}
			jsonDomains.add(jsonDomain);
		}

		return JsonUtils.write(jsonDomains);
	}

	public String getMessagesData() throws JsonProcessingException, IOException {

		queryContext.setUserId(authToken.getUserId());
		queryContext.setUserLanguage(localeCtrl.getLanguage());

		ResourceBundle bundle = ResourceBundle.getBundle("resources/clientMessages",
				localeCtrl.getLocale());
		return JsonUtils.write(bundle);
	}

	public String getUser() throws JsonProcessingException, IOException {
		HashMap<String, String> map = new HashMap<>();
		String username = authToken.getUsername();
		if (StringUtils.isNoneBlank(username)) {
			map.put("username", username);
		}
		return JsonUtils.write(map);
	}

	public List<UserContribSummary> getContributors() {
		return userService.findContributors();
	}
}
