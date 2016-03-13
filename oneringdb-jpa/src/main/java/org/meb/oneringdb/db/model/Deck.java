package org.meb.oneringdb.db.model;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
import javax.persistence.Version;

import org.hibernate.annotations.Type;
import org.meb.oneringdb.db.converter.DeckTypeConverter;
import org.meb.oneringdb.db.converter.TournamentPlaceConverter;
import org.meb.oneringdb.db.converter.TournamentTypeConverter;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Entity
@Table(name = "ort_deck")
@Access(AccessType.FIELD)
public class Deck {

	private Integer coreSetQuantity;

	private String name;
	private String description;

	@Temporal(TemporalType.TIMESTAMP)
	private Date createDate;

	@Temporal(TemporalType.TIMESTAMP)
	private Date modifyDate;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	private User user;

	@Convert(converter = DeckTypeConverter.class)
	@Column(name = "type_code")
	private DeckType type;

	@Convert(converter = TournamentTypeConverter.class)
	private TournamentType tournamentType;

	@Convert(converter = TournamentPlaceConverter.class)
	private TournamentPlace tournamentPlace;

	@ManyToOne
	@JoinColumn(name = "snapshot_base_id")
	private Deck snapshotBase;

	@Type(type = "org.hibernate.type.YesNoType")
	private Boolean snapshotPublic;

	@OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
	private Set<DeckMember> deckMembers = new HashSet<>();

	@OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("createDate DESC")
	private Set<DeckLink> deckLinks = new HashSet<>();

	@OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("createDate ASC")
	private Set<DeckComment> deckComments = new HashSet<>();

	@OneToMany(mappedBy = "snapshotBase")
	@OrderBy("createDate DESC")
	private Set<Deck> snapshots = new HashSet<Deck>();
	
	@Embedded
	private DeckComp comp;

	@Transient
	private Set<Deck> relatedSnapshots = new HashSet<Deck>();

	@Transient
	private DeckInterest totalDeckInterest;

	@Transient
	private DeckInterest userDeckInterest;

	@Version
	private Long version;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	public Deck(Long id) {
		this.id = id;
	}

	public Deck(DeckType type) {
		this.type = type;
	}
}
