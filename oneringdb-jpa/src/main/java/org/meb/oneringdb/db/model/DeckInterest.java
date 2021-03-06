package org.meb.oneringdb.db.model;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Entity
@Table(name = "ort_deck_interest")
public class DeckInterest {

	private Long deckId;
	private Long userId;

	private Integer favourite;
	private Integer superb;
	private Date favouriteDate;
	private Date superbDate;

	@Version
	private Long version;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	public DeckInterest(Long id) {
		this.id = id;
	}

	public DeckInterest(Long deckId, Long userId) {
		this.deckId = deckId;
		this.userId = userId;
	}
}
