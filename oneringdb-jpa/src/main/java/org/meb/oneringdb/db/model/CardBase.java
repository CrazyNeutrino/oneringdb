package org.meb.oneringdb.db.model;

import java.util.HashMap;
import java.util.Map;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Convert;
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

import org.hibernate.annotations.Type;
import org.meb.oneringdb.db.converter.CardTypeConverter;
import org.meb.oneringdb.db.converter.SphereConverter;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = { "langItems" })
@Entity
@Table(name = "ort_card")
public class CardBase implements IBase<CardLang> {

	private String techName;

	@Convert(converter = CardTypeConverter.class)
	@Column(name = "type_code")
	private CardType type;

	@Convert(converter = SphereConverter.class)
	@Column(name = "sphere_code")
	private Sphere sphere;

	private Integer threatCost;
	private Integer resourceCost;
	private Integer engagementCost;
	private Integer willpower;
	private Integer threat;
	private Integer attack;
	private Integer defense;
	private Integer hitPoints;
	private Integer questPoints;
	private Integer victoryPoints;

	private Integer number;
	private Integer quantity;
	private String illustrator;
	private String recordState;
	private String octgnId;

	@Column(name = "unq")
	@Type(type = "org.hibernate.type.YesNoType")
	private Boolean unique;

	@OneToMany(mappedBy = "base", cascade = CascadeType.ALL)
	@MapKey(name = "langCode")
	@OrderBy(value = "langCode")
	private Map<String, CardLang> langItems;

	@ManyToOne
	@JoinColumn(name = "crst_id")
	private CardSetBase cardSetBase;

	@ManyToOne
	@JoinColumn(name = "enst_id")
	private EncounterSetBase encounterSetBase;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Version
	private Long version;

	public CardBase() {
		this(null);
	}

	public CardBase(String techName) {
		this.techName = techName;
		langItems = new HashMap<String, CardLang>();
	}
}
