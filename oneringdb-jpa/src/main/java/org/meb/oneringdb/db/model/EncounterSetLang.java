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
@Table(name = "ort_encounter_set_l")
public class EncounterSetLang implements ILang<EncounterSetBase> {

	private String name;
	private String recordState;

	@ManyToOne
	@JoinColumn(name = "enst_id")
	private EncounterSetBase base;
	private String langCode;

	@Version
	private Long version;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
}
