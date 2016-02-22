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
@ToString(exclude = { "base" })
@Entity
@Table(name = "tb_scenario_l")
public class ScenarioLang implements ILang<ScenarioBase> {

	private String name;
	private String description;
	private String recordState;

	@ManyToOne
	@JoinColumn(name = "scen_id")
	private ScenarioBase base;
	private String langCode;
	
	@Version
	private Long version;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
}
