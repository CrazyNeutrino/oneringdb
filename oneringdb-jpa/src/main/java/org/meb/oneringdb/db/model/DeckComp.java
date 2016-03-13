package org.meb.oneringdb.db.model;

import javax.persistence.Column;
import javax.persistence.Embeddable;

import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class DeckComp {

	@Column(name = "comp_cards_qty")
	private Integer cardsQuantity = 0;

	@Column(name = "comp_ally_cards_qty")
	private Integer armyCardsQuantity = 0;

	@Column(name = "comp_attach_cards_qty")
	private Integer attachmentCardsQuantity = 0;

	@Column(name = "comp_event_cards_qty")
	private Integer eventCardsQuantity = 0;
	
	@Column(name = "comp_crst_bitmap0")
	private Long crstBitmap0 = 0L;
	
	@Column(name = "comp_crst_bitmap1")
	private Long crstBitmap1 = 0L;
	
	@Column(name = "comp_hero_bitmap0")
	private Long heroBitmap0 = 0L;
	
	@Column(name = "comp_hero_bitmap1")
	private Long heroBitmap1 = 0L;
	
	@Column(name = "comp_sphere_bitmap")
	private Long sphereBitmap = 0L;
}
