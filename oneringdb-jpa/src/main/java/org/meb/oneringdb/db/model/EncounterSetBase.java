package org.meb.oneringdb.db.model;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.MapKey;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import javax.persistence.Version;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = { "langItems", "scenEnstLinkItems" })
@Entity
@Table(name = "ort_encounter_set")
public class EncounterSetBase implements IBase<EncounterSetLang> {

	private String techName;
	private String recordState;

	@OneToMany(mappedBy = "base", cascade = CascadeType.ALL)
	@MapKey(name = "langCode")
	@OrderBy(value = "langCode")
	private Map<String, EncounterSetLang> langItems;

	@OneToMany(mappedBy = "encounterSetBase", cascade = CascadeType.ALL)
	@OrderBy(value = "sequence")
	private Set<ScenEnstLink> scenEnstLinkItems;
	
	@ManyToOne
	@JoinColumn(name = "crst_id")
	private CardSetBase cardSetBase;

	@Version
	private Long version;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	public EncounterSetBase() {
		this(null);
	}

	public EncounterSetBase(String techName) {
		this.techName = techName;
		langItems = new HashMap<String, EncounterSetLang>();
		scenEnstLinkItems = new HashSet<ScenEnstLink>();
	}
	
	public EncounterSetBase cloneWithIdentity() {
		return new EncounterSetBase(techName);
	}
}
