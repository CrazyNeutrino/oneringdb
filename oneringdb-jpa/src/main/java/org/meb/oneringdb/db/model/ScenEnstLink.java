package org.meb.oneringdb.db.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Version;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity
@Table(name = "ort_scen_enst_link")
public class ScenEnstLink {

	@ManyToOne
	@JoinColumn(name = "scen_id")
	private ScenarioBase scenarioBase;

	@ManyToOne
	@JoinColumn(name = "enst_id")
	private EncounterSetBase encounterSetBase;
	
	private Integer sequence;

	@Version
	private Long version;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	public ScenEnstLink cloneWithIdentity() {
		ScenEnstLink clone = new ScenEnstLink();
		if (scenarioBase != null) {
			clone.setScenarioBase(new ScenarioBase(scenarioBase.getTechName()));
		}
		if (encounterSetBase != null) {
			clone.setEncounterSetBase(new EncounterSetBase(encounterSetBase.getTechName()));
		}
		return clone;
	}
}
