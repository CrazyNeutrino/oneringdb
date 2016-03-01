package org.meb.oneringdb.web.json.model;

import org.meb.oneringdb.db.model.loc.EncounterSet;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class JsonEncounterSet {

	private Long id;
	private String name;
	private String techName;
	private String crstName;
	private String crstTechName;
	private Integer crstSequence;

	public JsonEncounterSet(EncounterSet encounterSet) {
		id = encounterSet.getId();
		techName = encounterSet.getTechName();
		name = encounterSet.getName();
		crstName = encounterSet.getCrstName();
		crstTechName = encounterSet.getCrstTechName();
		crstSequence = encounterSet.getCrstSequence();
	}
}
