package org.meb.oneringdb.db.model.loc;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "orv_encounter_set")
public class EncounterSet {

	private Long crstId;
	private String crstName;
	private String crstTechName;
	private Integer crstSequence;
	private String cycleName;
	private String cycleTechName;
	private String name;
	private String techName;

	@Version
	private Long version;

	@Id
	private Long id;

	public EncounterSet() {
	}

	public EncounterSet(Long id) {
		this.id = id;
	}
}
