package org.meb.oneringdb.db.model.loc;

import java.util.Date;

import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import org.hibernate.annotations.Type;
import org.meb.oneringdb.db.converter.CardTypeConverter;
import org.meb.oneringdb.db.converter.SphereConverter;
import org.meb.oneringdb.db.model.CardType;
import org.meb.oneringdb.db.model.Sphere;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Entity
@Table(name = "orv_card")
@Access(AccessType.FIELD)
public class Card {

	private String techName;

	@Convert(converter = CardTypeConverter.class)
	@Column(name = "type_code")
	private CardType type;
	private String typeDisplay;

	@Convert(converter = SphereConverter.class)
	@Column(name = "sphere_code")
	private Sphere sphere;
	private String sphereDisplay;

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
	
	private String name;
	private String nameEn;
	private String text;
	private String traits;
	private String traitsEn;
	private String keywords;
	private Date faqDate;
	private String faqText;
	private String faqVersion;
	private String flavorText;
	
	private Long crstId;
	private String crstName;
	private String crstReleaseDate;
	private Integer crstSequence;
	private String crstTechName;
	
	private Long enstId;
	private String enstName;
	private String enstTechName;

	private String illustrator;
	private Integer number;
	private Integer quantity;
	private String octgnId;
	private String imageLangCode;
	
	@Column(name = "unq")
	@Type(type = "org.hibernate.type.YesNoType")
	private Boolean unique;
	
	@Type(type = "org.hibernate.type.YesNoType")
	private Boolean localized;

	private Long id;

	@Version
	private Long version;

	public Card(Long id) {
		this.id = id;
	}

	public Card(CardType type) {
		this.type = type;
	}

	@Id
	@Access(AccessType.PROPERTY)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}
}
